import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/scrap/:id/dispose - Mark scrap as disposed
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { disposalMethod, valueRealized, disposalNotes } =
      body;

    if (!disposalMethod) {
      return NextResponse.json(
        { error: "Disposal method is required" },
        { status: 400 }
      );
    }

    const scrapRecord = await prisma.scrapRecord.findUnique({
      where: { id: params.id },
      include: { item: true },
    });

    if (!scrapRecord) {
      return NextResponse.json(
        { error: "Scrap record not found" },
        { status: 404 }
      );
    }

    if (scrapRecord.disposalDate) {
      return NextResponse.json(
        { error: "Scrap already disposed" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update scrap record with disposal information
      const updatedScrap = await tx.scrapRecord.update({
        where: { id: params.id },
        data: {
          disposalDate: new Date(),
          disposalMethod,
          valueRealized: valueRealized ? parseFloat(valueRealized) : null,
          disposalNotes: disposalNotes || scrapRecord.disposalNotes,
        },
        include: {
          item: {
            include: {
              category: true,
            },
          },
        },
      });

      // Create stock movement for disposal
      const item = await tx.item.findUnique({ where: { id: scrapRecord.itemId } });
      const previousQty = item!.quantityAvailable;
      const newQty = previousQty; // Quantity doesn't change on disposal since it was already scrapped

      await tx.stockMovement.create({
        data: {
          itemId: scrapRecord.itemId,
          movementType: "OUTWARD",
          quantity: 1,
          previousQuantity: previousQty,
          newQuantity: newQty,
          notes: `Scrap disposed via ${disposalMethod}${valueRealized ? `. Value realized: ₹${valueRealized}` : ""
            }${disposalNotes ? `. ${disposalNotes}` : ""}`,
          performedByUserId: session.user?.id || "",
        },
      });

      return updatedScrap;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error disposing scrap:", error);
    return NextResponse.json(
      { error: "Failed to dispose scrap" },
      { status: 500 }
    );
  }
}
