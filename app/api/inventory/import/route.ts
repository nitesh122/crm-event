import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/inventory/import - Bulk import items from CSV data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role === "VIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided for import" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each item
    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];

      try {
        // Validate required fields
        if (!itemData.name || !itemData.categoryName) {
          results.failed++;
          results.errors.push(
            `Row ${i + 1}: Missing name or category`
          );
          continue;
        }

        // Find or create category
        let category = await prisma.category.findFirst({
          where: { name: itemData.categoryName },
        });

        if (!category) {
          category = await prisma.category.create({
            data: { name: itemData.categoryName },
          });
        }

        // Find or create subcategory if provided
        let subcategoryId = null;
        if (itemData.subcategoryName) {
          let subcategory = await prisma.subcategory.findFirst({
            where: {
              name: itemData.subcategoryName,
              categoryId: category.id,
            },
          });

          if (!subcategory) {
            subcategory = await prisma.subcategory.create({
              data: {
                name: itemData.subcategoryName,
                categoryId: category.id,
              },
            });
          }

          subcategoryId = subcategory.id;
        }

        // Create or update item
        const existingItem = await prisma.item.findFirst({
          where: {
            name: itemData.name,
            categoryId: category.id,
          },
        });

        if (existingItem) {
          // Update existing item quantity
          await prisma.item.update({
            where: { id: existingItem.id },
            data: {
              quantityAvailable: {
                increment: parseInt(itemData.quantity) || 0,
              },
              ...(itemData.description
                ? { description: itemData.description }
                : {}),
              ...(itemData.cost ? { cost: parseFloat(itemData.cost) } : {}),
              ...(itemData.vendor ? { vendor: itemData.vendor } : {}),
            },
          });
        } else {
          // Create new item
          await prisma.item.create({
            data: {
              name: itemData.name,
              categoryId: category.id,
              subcategoryId,
              description: itemData.description || null,
              quantityAvailable: parseInt(itemData.quantity) || 0,
              cost: itemData.cost ? parseFloat(itemData.cost) : null,
              vendor: itemData.vendor || null,
              condition: "GOOD",
            },
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error importing items:", error);
    return NextResponse.json(
      { error: "Failed to import items" },
      { status: 500 }
    );
  }
}
