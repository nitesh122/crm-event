import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageInventory } from "@/lib/permissions";

// GET /api/sites/[id] - Get single site
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const site = await prisma.site.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          orderBy: { startDate: "desc" },
          take: 10,
        },
        siteInventory: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
            siteInventory: true,
            labourAttendances: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}

// PUT /api/sites/[id] - Update site
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canManageInventory(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, location, description, isActive } = body;

    const site = await prisma.site.update({
      where: { id: params.id },
      data: {
        name,
        location,
        description,
        isActive,
      },
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 }
    );
  }
}

// DELETE /api/sites/[id] - Delete site and return all unreturned items to stock
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canManageInventory(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Step 1: Find all SiteInventory rows that have NOT been returned yet
    const unreturnedInventory = await prisma.siteInventory.findMany({
      where: {
        siteId: params.id,
        actualReturnDate: null, // only items still out
      },
      include: {
        item: { select: { id: true, quantityAvailable: true, name: true } },
      },
    });

    // Step 2: Run everything in a single transaction for safety
    await prisma.$transaction(async (tx) => {
      // For each unreturned item: restore stock + create INWARD movement
      for (const inv of unreturnedInventory) {
        const newQty = inv.item.quantityAvailable + inv.quantityDeployed;

        // Restore quantity
        await tx.item.update({
          where: { id: inv.itemId },
          data: { quantityAvailable: newQty },
        });

        // Record inward stock movement
        await tx.stockMovement.create({
          data: {
            itemId: inv.itemId,
            movementType: "INWARD",
            quantity: inv.quantityDeployed,
            previousQuantity: inv.item.quantityAvailable,
            newQuantity: newQty,
            notes: `Auto-returned on site deletion (Site ID: ${params.id})`,
            performedByUserId: session.user.id,
          },
        });
      }

      // Step 3: Delete the site (cascades to SiteInventory, Challans, etc. per schema)
      await tx.site.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      success: true,
      itemsReturned: unreturnedInventory.length,
      message:
        unreturnedInventory.length > 0
          ? `Site deleted. ${unreturnedInventory.length} item(s) returned to stock.`
          : "Site deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json(
      { error: "Failed to delete site." },
      { status: 500 }
    );
  }
}

