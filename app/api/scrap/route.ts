import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createScrapSchema, validateRequest } from "@/lib/validations";
import { Prisma } from "@prisma/client";

// GET /api/scrap - List all scrap records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Prisma.ScrapRecordWhereInput = {};

    if (status && status !== "ALL") {
      if (status === "DISPOSED") {
        where.NOT = { disposalDate: undefined };
      } else if (status === "PENDING") {
        where.disposalDate = undefined;
      }
    }

    const scrapRecords = await prisma.scrapRecord.findMany({
      where,
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate summary statistics
    const summary = {
      total: scrapRecords.length,
      pending: scrapRecords.filter((s) => !s.disposalDate).length,
      disposed: scrapRecords.filter((s) => s.disposalDate).length,
      totalValueRealized: scrapRecords.reduce(
        (sum, s) =>
          sum + (s.valueRealized ? parseFloat(s.valueRealized.toString()) : 0),
        0
      ),
    };

    return NextResponse.json({ scrapRecords, summary });
  } catch (error) {
    console.error("Error fetching scrap records:", error);
    return NextResponse.json(
      { error: "Failed to fetch scrap records" },
      { status: 500 }
    );
  }
}

// POST /api/scrap - Create new scrap record
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
    const validation = validateRequest(createScrapSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      itemId,
      reason,
      disposalMethod,
      disposalDate,
      valueRealized,
      disposalNotes,
      approvedBy,
    } = validation.data;

    // Verify item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const scrapRecord = await prisma.$transaction(async (tx) => {
      // Create scrap record
      const newScrap = await tx.scrapRecord.create({
        data: {
          itemId,
          reason,
          disposalMethod,
          disposalDate: new Date(disposalDate),
          valueRealized: valueRealized || null,
          disposalNotes: disposalNotes || null,
          approvedBy: approvedBy || null,
        },
        include: {
          item: {
            include: {
              category: true,
            },
          },
        },
      });

      // Update item condition to SCRAP and deduct 1 from quantity
      const previousQty = item.quantityAvailable;
      await tx.item.update({
        where: { id: itemId },
        data: {
          condition: "SCRAP",
          quantityAvailable: { decrement: 1 },
        },
      });
      const newQty = previousQty - 1;

      // Create stock movement to track scrap
      await tx.stockMovement.create({
        data: {
          itemId,
          movementType: "OUTWARD",
          quantity: 1,
          previousQuantity: previousQty,
          newQuantity: newQty,
          conditionAfter: "SCRAP",
          notes: `Item scrapped: ${reason}`,
          performedByUserId: session.user.id, // FIXED: No more || "" fallback
        },
      });

      return newScrap;
    });

    return NextResponse.json(scrapRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating scrap record:", error);
    return NextResponse.json(
      { error: "Failed to create scrap record" },
      { status: 500 }
    );
  }
}

