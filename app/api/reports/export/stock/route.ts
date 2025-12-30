import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this route (uses authentication)
export const dynamic = 'force-dynamic';

// GET /api/reports/export/stock - Export stock report as CSV
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.item.findMany({
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Generate CSV
    const headers = [
      "Item Name",
      "Category",
      "Subcategory",
      "Quantity Available",
      "Condition",
      "Cost",
      "Vendor",
      "Remarks",
    ];

    const rows = items.map((item) => [
      item.name,
      item.category.name,
      item.subcategory?.name || "",
      item.quantityAvailable.toString(),
      item.condition,
      item.cost?.toString() || "",
      item.vendor || "",
      item.remarks || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="stock-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting stock report:", error);
    return NextResponse.json(
      { error: "Failed to export stock report" },
      { status: 500 }
    );
  }
}
