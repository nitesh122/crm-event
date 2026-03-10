"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/lib/hooks/useToast";

type BundleTemplateInfo = {
    id: string;
    name: string;
    items: {
        quantityPerBaseUnit: number;
        item: {
            id: string;
            name: string;
            componentType: string | null;
        };
    }[];
};

type SiteInventoryItem = {
    id: string;
    quantityDeployed: number;
    deployedDate: Date;
    expectedReturnDate: Date | null;
    actualReturnDate: Date | null;
    notes: string | null;
    shiftType: string;
    item: {
        id: string;
        name: string;
        isKitComponent?: boolean;
        kitType?: string | null;
        componentType?: string | null;
        quantityPerKit?: number | null;
        category: { name: string };
        subcategory: { name: string } | null;
        bundleTemplateItems?: {
            bundleTemplate: BundleTemplateInfo;
        }[];
    };
};

// A processed kit group: all SiteInventory rows that belong to same tent kit
type KitGroup = {
    kitName: string;
    bundleTemplateId: string;
    deployedDate: Date;
    expectedReturnDate: Date | null;
    actualReturnDate: Date | null;
    kitQuantity: number; // number of complete tent kits
    components: {
        invId: string;
        itemId: string;
        itemName: string;
        componentType: string | null;
        quantityDeployed: number;
        quantityPerKit: number;
    }[];
};

function getStatusBadge(inv: { actualReturnDate: Date | null; expectedReturnDate: Date | null }) {
    if (inv.actualReturnDate) {
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Returned</span>;
    }
    const isOverdue = inv.expectedReturnDate && new Date(inv.expectedReturnDate) < new Date();
    if (isOverdue) {
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Overdue</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Deployed</span>;
}

export default function SiteInventoryClient({
    siteInventory,
}: {
    siteInventory: SiteInventoryItem[];
}) {
    const { error } = useToast();
    const [expandedKits, setExpandedKits] = useState<Set<string>>(new Set());

    // --- Group kit components by their BundleTemplate ---
    // A SiteInventory row is a kit component if item.bundleTemplateItems is non-empty
    const kitGroups = new Map<string, KitGroup>();
    const regularRows: SiteInventoryItem[] = [];

    for (const inv of siteInventory) {
        const btItems = inv.item.bundleTemplateItems;
        // isKitComponent items that belong to a bundle template → group them
        if (btItems && btItems.length > 0) {
            const bt = btItems[0].bundleTemplate; // each component belongs to one kit
            const existing = kitGroups.get(bt.id);

            // Qty per kit for this specific component
            const qtyPerKit =
                bt.items.find((bti) => bti.item.id === inv.item.id)?.quantityPerBaseUnit ?? 1;
            // Derive complete kits from this component entry
            const kitsFromThisRow = Math.floor(inv.quantityDeployed / qtyPerKit);

            if (existing) {
                existing.components.push({
                    invId: inv.id,
                    itemId: inv.item.id,
                    itemName: inv.item.name,
                    componentType: inv.item.componentType ?? null,
                    quantityDeployed: inv.quantityDeployed,
                    quantityPerKit: qtyPerKit,
                });
                // Kit quantity = min across all components (most conservative)
                existing.kitQuantity = Math.min(existing.kitQuantity, kitsFromThisRow);
            } else {
                kitGroups.set(bt.id, {
                    kitName: bt.name,
                    bundleTemplateId: bt.id,
                    deployedDate: inv.deployedDate,
                    expectedReturnDate: inv.expectedReturnDate,
                    actualReturnDate: inv.actualReturnDate,
                    kitQuantity: kitsFromThisRow,
                    components: [
                        {
                            invId: inv.id,
                            itemId: inv.item.id,
                            itemName: inv.item.name,
                            componentType: inv.item.componentType ?? null,
                            quantityDeployed: inv.quantityDeployed,
                            quantityPerKit: qtyPerKit,
                        },
                    ],
                });
            }
        } else {
            regularRows.push(inv);
        }
    }

    const toggleKit = (kitId: string) => {
        setExpandedKits((prev) => {
            const next = new Set(prev);
            if (next.has(kitId)) next.delete(kitId);
            else next.add(kitId);
            return next;
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="table min-w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="table-header">Item / Kit</th>
                        <th className="table-header">Category</th>
                        <th className="table-header">Quantity</th>
                        <th className="table-header">Deployed Date</th>
                        <th className="table-header">Expected Return</th>
                        <th className="table-header">Actual Return</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">Notes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">

                    {/* ── KIT GROUPS ── */}
                    {Array.from(kitGroups.values()).map((group) => {
                        const isExpanded = expandedKits.has(group.bundleTemplateId);
                        const statusInv = {
                            actualReturnDate: group.actualReturnDate,
                            expectedReturnDate: group.expectedReturnDate,
                        };

                        return (
                            <>
                                {/* Parent kit row */}
                                <tr key={group.bundleTemplateId} className="bg-amber-50 hover:bg-amber-100 transition">
                                    <td className="table-cell">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleKit(group.bundleTemplateId)}
                                                className="text-amber-700 hover:text-amber-900 font-bold text-lg leading-none w-5 flex-shrink-0"
                                                title={isExpanded ? "Collapse components" : "Expand components"}
                                            >
                                                {isExpanded ? "▼" : "▶"}
                                            </button>
                                            <div>
                                                <span className="font-semibold text-gray-900">
                                                    {group.kitName}
                                                </span>
                                                <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                                    ⛺ Tent Kit
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell text-sm text-gray-600">Tents</td>
                                    <td className="table-cell">
                                        <span className="font-bold text-lg text-amber-800">
                                            ×{group.kitQuantity}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-1">complete</span>
                                    </td>
                                    <td className="table-cell text-sm">
                                        {new Date(group.deployedDate).toLocaleDateString()}
                                    </td>
                                    <td className="table-cell text-sm">
                                        {group.expectedReturnDate
                                            ? new Date(group.expectedReturnDate).toLocaleDateString()
                                            : "—"}
                                    </td>
                                    <td className="table-cell text-sm">
                                        {group.actualReturnDate ? (
                                            <span className="text-green-600 font-medium">
                                                {new Date(group.actualReturnDate).toLocaleDateString()}
                                            </span>
                                        ) : "—"}
                                    </td>
                                    <td className="table-cell">{getStatusBadge(statusInv)}</td>
                                    <td className="table-cell text-xs text-gray-500">
                                        {group.components.length} components
                                    </td>
                                </tr>

                                {/* Expanded component breakdown */}
                                {isExpanded && (
                                    <tr key={`${group.bundleTemplateId}-expanded`}>
                                        <td colSpan={8} className="p-0 bg-amber-50 border-b border-amber-200">
                                            <div className="mx-6 my-3 rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                                                <div className="bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 uppercase tracking-wide">
                                                    ⛺ {group.kitName} — Component Breakdown ({group.kitQuantity} kit{group.kitQuantity !== 1 ? "s" : ""})
                                                </div>
                                                <table className="min-w-full">
                                                    <thead className="bg-white">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty/Kit</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Deployed</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-100">
                                                        {group.components.map((comp) => (
                                                            <tr key={comp.invId} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2.5">
                                                                    <Link
                                                                        href={`/dashboard/inventory/${comp.itemId}`}
                                                                        className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                                                                    >
                                                                        {comp.itemName}
                                                                    </Link>
                                                                </td>
                                                                <td className="px-4 py-2.5 text-xs text-gray-500">
                                                                    {comp.componentType ?? "—"}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-sm text-gray-600 text-right">
                                                                    ×{comp.quantityPerKit}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-right">
                                                                    <span className="font-semibold text-gray-900">
                                                                        {comp.quantityDeployed}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        );
                    })}

                    {/* ── REGULAR (NON-KIT) ROWS ── */}
                    {regularRows.map((inv) => {
                        const isOverdue =
                            !inv.actualReturnDate &&
                            inv.expectedReturnDate &&
                            new Date(inv.expectedReturnDate) < new Date();

                        return (
                            <tr key={inv.id} className={isOverdue ? "bg-red-50" : ""}>
                                <td className="table-cell">
                                    <Link
                                        href={`/dashboard/inventory/${inv.item.id}`}
                                        className="text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        {inv.item.name}
                                    </Link>
                                </td>
                                <td className="table-cell">
                                    <div>
                                        <p className="text-sm">{inv.item.category.name}</p>
                                        {inv.item.subcategory && (
                                            <p className="text-xs text-gray-500">{inv.item.subcategory.name}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <span className="font-semibold text-lg">{inv.quantityDeployed}</span>
                                </td>
                                <td className="table-cell text-sm">
                                    {new Date(inv.deployedDate).toLocaleDateString()}
                                </td>
                                <td className="table-cell text-sm">
                                    {inv.expectedReturnDate
                                        ? new Date(inv.expectedReturnDate).toLocaleDateString()
                                        : "—"}
                                </td>
                                <td className="table-cell text-sm">
                                    {inv.actualReturnDate ? (
                                        <span className="text-green-600 font-medium">
                                            {new Date(inv.actualReturnDate).toLocaleDateString()}
                                        </span>
                                    ) : "—"}
                                </td>
                                <td className="table-cell">
                                    {getStatusBadge(inv)}
                                </td>
                                <td className="table-cell text-xs text-gray-600 max-w-xs truncate">
                                    {inv.notes || "—"}
                                </td>
                            </tr>
                        );
                    })}

                    {kitGroups.size === 0 && regularRows.length === 0 && (
                        <tr>
                            <td colSpan={8} className="text-center py-8 text-gray-400">
                                No items deployed yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
