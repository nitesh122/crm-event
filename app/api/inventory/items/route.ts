import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageInventory } from "@/lib/permissions";
import { createItemSchema, validateRequest } from "@/lib/validations";
import { Prisma, ItemCondition } from "@prisma/client";

// Default pagination settings
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// GET /api/inventory/items - List all items with filters and pagination
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const subcategoryId = searchParams.get("subcategoryId");
    const condition = searchParams.get("condition");
    const search = searchParams.get("search");

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE)))
    );
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }
    if (condition && Object.values(ItemCondition).includes(condition as ItemCondition)) {
      where.condition = condition as ItemCondition;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { vendor: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute count and find in parallel for efficiency
    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
        },
        orderBy: {
          name: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/inventory/items - Create new item
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canManageInventory(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(createItemSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const validatedData = validation.data;

    const item = await prisma.item.create({
      data: {
        categoryId: validatedData.categoryId,
        subcategoryId: validatedData.subcategoryId || null,
        name: validatedData.name,
        description: validatedData.description,
        quantityAvailable: validatedData.quantityAvailable,
        condition: validatedData.condition,
        cost: validatedData.cost || null,
        vendor: validatedData.vendor,
        remarks: validatedData.remarks,
        imageUrl1: validatedData.imageUrl1,
        imageUrl2: validatedData.imageUrl2,
        imageUrl3: validatedData.imageUrl3,
        currentLocation: validatedData.currentLocation,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
