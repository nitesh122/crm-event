import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateChallans } from "@/lib/permissions";
import { createChallanSchema, validateRequest, ChallanItemInput } from "@/lib/validations";
import { Prisma } from "@prisma/client";

// GET /api/challans
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Prisma.ChallanWhereInput = {};
    if (projectId) where.projectId = projectId;

    const challans = await prisma.challan.findMany({
      where,
      include: {
        project: true,
        createdBy: true,
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(challans);
  } catch (error) {
    console.error("Error fetching challans:", error);
    return NextResponse.json(
      { error: "Failed to fetch challans" },
      { status: 500 }
    );
  }
}

// POST /api/challans - Create challan with automatic stock deduction
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canCreateChallans(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(createChallanSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { projectId, items, expectedReturnDate, remarks, truckNumber, driverName, driverPhone, movementDirection } = validation.data;

    // Use transaction to create challan and deduct stock
    // CRITICAL: Generate challan number INSIDE transaction to prevent race condition
    const result = await prisma.$transaction(async (tx) => {
      // Generate challan number atomically within transaction
      const lastChallan = await tx.challan.findFirst({
        orderBy: { createdAt: "desc" },
        select: { challanNumber: true },
      });

      const challanNumber = generateChallanNumber(lastChallan?.challanNumber);

      // Verify stock availability for all items
      for (const item of items) {
        const itemData = await tx.item.findUnique({
          where: { id: item.itemId },
        });

        if (!itemData) {
          throw new Error(`Item not found: ${item.itemId}`);
        }

        if (itemData.quantityAvailable < item.quantity) {
          throw new Error(
            `Insufficient stock for ${itemData.name}. Available: ${itemData.quantityAvailable}, Required: ${item.quantity}`
          );
        }
      }

      // Create challan
      const challan = await tx.challan.create({
        data: {
          challanNumber,
          projectId,
          createdByUserId: session.user.id,
          expectedReturnDate: expectedReturnDate
            ? new Date(expectedReturnDate)
            : null,
          remarks,
          truckNumber,
          driverName,
          driverPhone,
          movementDirection,
          items: {
            create: items.map((item: ChallanItemInput) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              notes: item.notes,
            })),
          },
        },
        include: {
          project: true,
          createdBy: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      });

      // Create stock movements and deduct quantities
      for (const item of items) {
        const currentItem = await tx.item.findUnique({
          where: { id: item.itemId },
        });

        if (!currentItem) continue;

        const previousQuantity = currentItem.quantityAvailable;
        const newQuantity = previousQuantity - item.quantity;

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            itemId: item.itemId,
            projectId,
            movementType: "OUTWARD",
            quantity: item.quantity,
            previousQuantity,
            newQuantity,
            notes: `Allocated via Challan ${challanNumber}`,
            performedByUserId: session.user.id,
          },
        });

        // Update item quantity
        await tx.item.update({
          where: { id: item.itemId },
          data: { quantityAvailable: newQuantity },
        });
      }

      return challan;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating challan:", error);
    const message = error instanceof Error ? error.message : "Failed to create challan";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Helper function to generate challan number
function generateChallanNumber(lastNumber?: string): string {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  if (!lastNumber) {
    return `${prefix}001`;
  }

  const lastNumberParts = lastNumber.split("-");
  const lastSequence = parseInt(lastNumberParts[lastNumberParts.length - 1]);
  const nextSequence = lastSequence + 1;

  return `${prefix}${nextSequence.toString().padStart(3, "0")}`;
}

