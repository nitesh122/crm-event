import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRepairSchema, validateRequest } from "@/lib/validations";
import { Prisma, RepairStatus } from "@prisma/client";

// GET /api/repairs - List all repair queue items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.RepairQueueWhereInput = {};

    if (status && status !== "ALL" && Object.values(RepairStatus).includes(status as RepairStatus)) {
      where.status = status as RepairStatus;
    }

    const repairs = await prisma.repairQueue.findMany({
      where,
      include: {
        item: {
          include: {
            category: true,
          },
        },
        assignedTo: true,
      },
      orderBy: [
        { createdAt: "desc" },
      ],
    });

    // Calculate summary statistics
    const summary = {
      total: repairs.length,
      pending: repairs.filter((r) => r.status === "PENDING").length,
      inRepair: repairs.filter((r) => r.status === "IN_REPAIR").length,
      completed: repairs.filter((r) => r.status === "COMPLETED").length,
      scrapped: repairs.filter((r) => r.status === "SCRAPPED").length,
      totalCost: repairs
        .filter((r) => r.repairCost)
        .reduce((sum, r) => sum + parseFloat(r.repairCost!.toString()), 0),
    };

    return NextResponse.json({ repairs, summary });
  } catch (error) {
    console.error("Error fetching repairs:", error);
    return NextResponse.json(
      { error: "Failed to fetch repairs" },
      { status: 500 }
    );
  }
}

// POST /api/repairs - Create new repair request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CRITICAL FIX: Ensure user ID exists before proceeding
    if (!session.user?.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(createRepairSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      itemId,
      assignedToUserId,
      technicianName,
      vendorName,
      repairCost,
      estimatedDays,
      notes,
    } = validation.data;

    // Verify item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const repair = await prisma.$transaction(async (tx) => {
      // Create repair queue entry
      const newRepair = await tx.repairQueue.create({
        data: {
          itemId,
          assignedToUserId: assignedToUserId || null,
          technicianName: technicianName || null,
          vendorName: vendorName || null,
          repairCost: repairCost || null,
          estimatedDays: estimatedDays || null,
          notes: notes || null,
          status: "PENDING",
          startDate: new Date(),
        },
        include: {
          item: {
            include: {
              category: true,
            },
          },
          assignedTo: true,
        },
      });

      // Update item condition to REPAIR_NEEDED
      const previousQty = item.quantityAvailable;
      await tx.item.update({
        where: { id: itemId },
        data: {
          condition: "REPAIR_NEEDED",
        },
      });

      // Create stock movement to track item entering repair
      await tx.stockMovement.create({
        data: {
          itemId,
          movementType: "OUTWARD",
          quantity: 1,
          previousQuantity: previousQty,
          newQuantity: previousQty,
          conditionAfter: "REPAIR_NEEDED",
          notes: `Item sent for repair${notes ? ': ' + notes : ''}`,
          performedByUserId: session.user.id, // FIXED: No more || "" fallback
        },
      });

      return newRepair;
    });

    return NextResponse.json(repair, { status: 201 });
  } catch (error) {
    console.error("Error creating repair:", error);
    return NextResponse.json(
      { error: "Failed to create repair request" },
      { status: 500 }
    );
  }
}

