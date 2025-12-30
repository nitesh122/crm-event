import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sites/[id]/inventory - Get site-based inventory view
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteInventory = await prisma.siteInventory.findMany({
      where: { siteId: params.id },
      include: {
        item: {
          include: {
            category: true,
            subcategory: true,
          },
        },
        site: true,
      },
      orderBy: {
        deployedDate: "desc",
      },
    });

    // Calculate summary
    const summary = {
      totalItems: siteInventory.length,
      totalQuantity: siteInventory.reduce((sum, inv) => sum + inv.quantityDeployed, 0),
      itemsDueBack: siteInventory.filter(
        (inv) => !inv.actualReturnDate && inv.expectedReturnDate && new Date(inv.expectedReturnDate) < new Date()
      ).length,
      itemsReturned: siteInventory.filter((inv) => inv.actualReturnDate).length,
    };

    return NextResponse.json({ inventory: siteInventory, summary });
  } catch (error) {
    console.error("Error fetching site inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch site inventory" },
      { status: 500 }
    );
  }
}
