import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageInventory } from "@/lib/permissions";

// POST /api/purchase-orders/[id]/receive - Receive partial/full delivery
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canManageInventory(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, quantityReceived, notes } = body;

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get PO item
      const poItem = await tx.purchaseOrderItem.findFirst({
        where: {
          purchaseOrderId: params.id,
          itemId: itemId,
        },
        include: {
          item: true,
          purchaseOrder: true,
        },
      });

      if (!poItem) {
        throw new Error("PO item not found");
      }

      // Check if receiving more than ordered
      const totalReceived = poItem.receivedQuantity + quantityReceived;
      if (totalReceived > poItem.orderedQuantity) {
        throw new Error(
          `Cannot receive ${quantityReceived}. Only ${
            poItem.orderedQuantity - poItem.receivedQuantity
          } remaining.`
        );
      }

      // Update PO item received quantity
      const updatedPoItem = await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: {
          receivedQuantity: totalReceived,
        },
      });

      // Create stock movement (INWARD)
      const currentItem = await tx.item.findUnique({
        where: { id: itemId },
      });

      if (!currentItem) {
        throw new Error("Item not found");
      }

      const previousQuantity = currentItem.quantityAvailable;
      const newQuantity = previousQuantity + quantityReceived;

      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          purchaseOrderId: params.id,
          movementType: "PURCHASE",
          quantity: quantityReceived,
          previousQuantity,
          newQuantity,
          notes: notes || `Received from PO ${poItem.purchaseOrder.poNumber}`,
          performedByUserId: session.user.id,
        },
      });

      // Update item quantity and cost
      await tx.item.update({
        where: { id: itemId },
        data: {
          quantityAvailable: newQuantity,
          // Update cost if provided in PO
          ...(poItem.unitCost && { cost: poItem.unitCost }),
        },
      });

      // Check if all items in PO are fully received
      const allPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: params.id },
      });

      const allFullyReceived = allPoItems.every(
        (item) => item.receivedQuantity >= item.orderedQuantity
      );

      const anyPartiallyReceived = allPoItems.some(
        (item) => item.receivedQuantity > 0 && item.receivedQuantity < item.orderedQuantity
      );

      // Update PO status
      let newStatus = poItem.purchaseOrder.status;
      if (allFullyReceived) {
        newStatus = "FULLY_RECEIVED";
      } else if (anyPartiallyReceived || totalReceived > 0) {
        newStatus = "PARTIALLY_RECEIVED";
      }

      await tx.purchaseOrder.update({
        where: { id: params.id },
        data: { status: newStatus },
      });

      return {
        poItem: updatedPoItem,
        movement,
        newStatus,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error receiving delivery:", error);
    return NextResponse.json(
      { error: error.message || "Failed to receive delivery" },
      { status: 500 }
    );
  }
}
