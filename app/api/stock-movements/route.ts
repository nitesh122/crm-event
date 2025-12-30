import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateStockMovements } from "@/lib/permissions";
import { createStockMovementSchema, validateRequest } from "@/lib/validations";
import { Prisma, MovementType } from "@prisma/client";

// GET /api/stock-movements
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const projectId = searchParams.get("projectId");
    const movementType = searchParams.get("movementType");

    const where: Prisma.StockMovementWhereInput = {};
    if (itemId) where.itemId = itemId;
    if (projectId) where.projectId = projectId;
    if (movementType && Object.values(MovementType).includes(movementType as MovementType)) {
      where.movementType = movementType as MovementType;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        item: true,
        project: true,
        performedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
      { status: 500 }
    );
  }
}

// POST /api/stock-movements - Create stock movement (inward, outward, return)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canCreateStockMovements(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(createStockMovementSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { itemId, projectId, movementType, quantity, conditionAfter, notes } = validation.data;

    // Use Prisma transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get current item
      const item = await tx.item.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error("Item not found");
      }

      const previousQuantity = item.quantityAvailable;
      let newQuantity = previousQuantity;

      // Calculate new quantity based on movement type
      switch (movementType) {
        case "INWARD":
          newQuantity = previousQuantity + quantity;
          break;
        case "OUTWARD":
          if (previousQuantity < quantity) {
            throw new Error("Insufficient stock");
          }
          newQuantity = previousQuantity - quantity;
          break;
        case "RETURN":
          newQuantity = previousQuantity + quantity;
          break;
        default:
          throw new Error("Invalid movement type");
      }

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          itemId,
          projectId: projectId || null,
          movementType,
          quantity,
          previousQuantity,
          newQuantity,
          conditionAfter,
          notes,
          performedByUserId: session.user.id,
        },
        include: {
          item: true,
          project: true,
          performedBy: true,
        },
      });

      // Update item quantity
      const updatedItem = await tx.item.update({
        where: { id: itemId },
        data: {
          quantityAvailable: newQuantity,
          // Update condition if specified (for returns)
          ...(conditionAfter && { condition: conditionAfter }),
        },
      });

      // If condition is REPAIR_NEEDED or DAMAGED, create maintenance record
      if (
        conditionAfter &&
        (conditionAfter === "REPAIR_NEEDED" || conditionAfter === "DAMAGED")
      ) {
        await tx.maintenanceRecord.create({
          data: {
            itemId,
            status: "PENDING",
            notes: notes || `Item marked as ${conditionAfter} during return`,
          },
        });
      }

      return { movement, updatedItem };
    });

    return NextResponse.json(result.movement, { status: 201 });
  } catch (error) {
    console.error("Error creating stock movement:", error);
    const message = error instanceof Error ? error.message : "Failed to create stock movement";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

