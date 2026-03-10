import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/sites/[id]/deployed-items
// Returns items currently deployed at the site (not yet returned)
// Also returns kitGroups for grouped display in the challan generate page
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
            where: {
                siteId: params.id,
                actualReturnDate: null, // Only items still deployed
            },
            include: {
                item: {
                    include: {
                        category: true,
                        // For kit components: get which BundleTemplate they belong to
                        bundleTemplateItems: {
                            include: {
                                bundleTemplate: {
                                    select: {
                                        id: true,
                                        name: true,
                                        items: {
                                            select: {
                                                quantityPerBaseUnit: true,
                                                item: {
                                                    select: { id: true, name: true, componentType: true },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Build flat items list for drag-and-drop / challan assignment
        const items = siteInventory.map((inv) => ({
            itemId: inv.itemId,
            itemName: inv.item.name,
            categoryId: inv.item.categoryId,
            categoryName: inv.item.category.name,
            quantity: inv.quantityDeployed,
            weightPerUnit: inv.item.weightPerUnit,
            totalWeight: (inv.item.weightPerUnit || 0) * inv.quantityDeployed,
            hsnCode: inv.item.hsnCode,
            isKitComponent: inv.item.bundleTemplateItems.length > 0,
            kitName: inv.item.bundleTemplateItems[0]?.bundleTemplate.name ?? null,
            componentType: inv.item.componentType ?? null,
        }));

        // Build grouped kit data for the summary panel
        const kitGroupMap = new Map<string, {
            bundleTemplateId: string;
            kitName: string;
            kitQuantity: number;
            components: {
                itemId: string;
                itemName: string;
                componentType: string | null;
                quantityDeployed: number;
                quantityPerKit: number;
            }[];
        }>();

        for (const inv of siteInventory) {
            const btItem = inv.item.bundleTemplateItems[0];
            if (!btItem) continue;
            const bt = btItem.bundleTemplate;
            const qtyPerKit = bt.items.find((x) => x.item.id === inv.item.id)?.quantityPerBaseUnit ?? 1;
            const kitsFromRow = Math.floor(inv.quantityDeployed / qtyPerKit);

            const existing = kitGroupMap.get(bt.id);
            if (existing) {
                existing.kitQuantity = Math.min(existing.kitQuantity, kitsFromRow);
                existing.components.push({
                    itemId: inv.item.id,
                    itemName: inv.item.name,
                    componentType: inv.item.componentType ?? null,
                    quantityDeployed: inv.quantityDeployed,
                    quantityPerKit: qtyPerKit,
                });
            } else {
                kitGroupMap.set(bt.id, {
                    bundleTemplateId: bt.id,
                    kitName: bt.name,
                    kitQuantity: kitsFromRow,
                    components: [{
                        itemId: inv.item.id,
                        itemName: inv.item.name,
                        componentType: inv.item.componentType ?? null,
                        quantityDeployed: inv.quantityDeployed,
                        quantityPerKit: qtyPerKit,
                    }],
                });
            }
        }

        return NextResponse.json({
            items,
            kitGroups: Array.from(kitGroupMap.values()),
        });
    } catch (error) {
        console.error("Error fetching deployed items:", error);
        return NextResponse.json(
            { error: "Failed to fetch deployed items" },
            { status: 500 }
        );
    }
}
