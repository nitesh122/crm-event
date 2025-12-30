import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageInventory } from "@/lib/permissions";
import { createPurchaseOrderSchema, validateRequest, PurchaseOrderItemInput } from "@/lib/validations";
import { Prisma, POStatus } from "@prisma/client";

// GET /api/purchase-orders - List all purchase orders
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const vendor = searchParams.get("vendor");

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (status && Object.values(POStatus).includes(status as POStatus)) {
      where.status = status as POStatus;
    }
    if (vendor) where.vendor = { contains: vendor, mode: "insensitive" };

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
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
            items: true,
            stockMovements: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders - Create new purchase order
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canManageInventory(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(createPurchaseOrderSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      poNumber,
      vendor,
      orderDate,
      expectedDate,
      totalAmount,
      pdfUrl,
      excelUrl,
      notes,
      items,
    } = validation.data;

    // Check if PO number already exists
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "PO number already exists" },
        { status: 400 }
      );
    }

    // Create PO with items in a transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          vendor,
          orderDate: new Date(orderDate),
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          totalAmount: totalAmount || null,
          pdfUrl,
          excelUrl,
          notes,
          createdByUserId: session.user.id,
          status: "PENDING",
        },
      });

      // Create PO items if provided
      if (items && items.length > 0) {
        await tx.purchaseOrderItem.createMany({
          data: items.map((item: PurchaseOrderItemInput) => ({
            purchaseOrderId: po.id,
            itemId: item.itemId,
            orderedQuantity: item.orderedQuantity,
            unitCost: item.unitCost || null,
            notes: item.notes,
          })),
        });
      }

      return tx.purchaseOrder.findUnique({
        where: { id: po.id },
        include: {
          createdBy: true,
          items: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}

