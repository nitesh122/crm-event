import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/stock-movements/manual - Record manual purchase or sale
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, itemId, quantity, unitPrice, vendor, invoiceNumber, notes } =
      body;

    if (!type || !itemId || !quantity) {
      return NextResponse.json(
        { error: "Type, item, and quantity are required" },
        { status: 400 }
      );
    }

    if (type !== "PURCHASE" && type !== "SALE") {
      return NextResponse.json(
        { error: "Type must be either PURCHASE or SALE" },
        { status: 400 }
      );
    }

    // Verify item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const qty = parseInt(quantity);

    // For sales, check if sufficient quantity is available
    if (type === "SALE" && qty > item.quantityAvailable) {
      return NextResponse.json(
        {
          error: `Insufficient quantity. Only ${item.quantityAvailable} available.`,
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get current quantity for tracking
      const previousQty = item.quantityAvailable;
      const quantityChange = type === "PURCHASE" ? qty : -qty;
      const newQty = previousQty + quantityChange;

      // Update item quantity
      await tx.item.update({
        where: { id: itemId },
        data: {
          quantityAvailable: { increment: quantityChange },
          // Update cost if unit price is provided for purchases
          ...(type === "PURCHASE" && unitPrice
            ? { cost: parseFloat(unitPrice) }
            : {}),
        },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          movementType: type,
          quantity: qty,
          previousQuantity: previousQty,
          newQuantity: newQty,
          notes: `${type === "PURCHASE" ? "Purchase" : "Sale"}${
            vendor ? ` - ${vendor}` : ""
          }${invoiceNumber ? ` (Invoice: ${invoiceNumber})` : ""}${
            notes ? `. ${notes}` : ""
          }`,
          performedByUserId: session.user?.id || "",
        },
      });

      return movement;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error recording manual transaction:", error);
    return NextResponse.json(
      { error: "Failed to record transaction" },
      { status: 500 }
    );
  }
}
