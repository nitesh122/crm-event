"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useToast } from "@/lib/hooks/useToast";
import { useSiteItems } from "./hooks/useSiteItems";
import { useProjects } from "./hooks/useProjects";
import { SiteItem, KitGroup, Truck, TruckItem } from "./types";


// KitGroupCard: shows a tent kit grouped summary
function KitGroupCard({ kg }: { kg: KitGroup }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition"
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">⛺</span>
                    <span className="font-semibold text-gray-900">{kg.kitName}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                        ×{kg.kitQuantity} {kg.kitQuantity === 1 ? "tent" : "tents"}
                    </span>
                    <span className="text-xs text-gray-500">{kg.components.length} components</span>
                </div>
                <svg className={`w-4 h-4 text-amber-700 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="border-t border-amber-100 px-4 py-2 bg-amber-50">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase">
                                <th className="text-left py-1">Component</th>
                                <th className="text-left py-1">Type</th>
                                <th className="text-right py-1">Qty/Kit</th>
                                <th className="text-right py-1">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kg.components.map((c) => (
                                <tr key={c.itemId} className="border-t border-amber-100">
                                    <td className="py-1.5 text-gray-800">{c.itemName}</td>
                                    <td className="py-1.5 text-gray-500 text-xs">{c.componentType ?? "—"}</td>
                                    <td className="py-1.5 text-right text-gray-600">×{c.quantityPerKit}</td>
                                    <td className="py-1.5 text-right font-semibold text-gray-900">{c.quantityDeployed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function GenerateChallansPage() {

    const searchParams = useSearchParams();
    const router = useRouter();
    const siteId = searchParams.get("siteId");
    const { success, error } = useToast();

    // Fetch data
    const { items: siteItems, kitGroups, loading: itemsLoading } = useSiteItems(siteId);
    const { projects, loading: projectsLoading } = useProjects();

    // State
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [itemRemainingQuantities, setItemRemainingQuantities] = useState<Map<string, number>>(new Map());
    const [creatingChallan, setCreatingChallan] = useState(false);
    const [creatingAll, setCreatingAll] = useState(false);

    // Per-item assignment selections: itemId -> { truckId, qty }
    const [itemSelections, setItemSelections] = useState<Map<string, { truckId: string; qty: number }>>(new Map());

    // Initialize remaining quantities when items load
    useEffect(() => {
        if (siteItems.length > 0 && itemRemainingQuantities.size === 0) {
            const initialQuantities = new Map<string, number>();
            siteItems.forEach(item => {
                initialQuantities.set(item.itemId, item.quantity);
            });
            setItemRemainingQuantities(initialQuantities);
        }
    }, [siteItems, itemRemainingQuantities]);

    // Available items (remaining qty > 0)
    const availableItems = siteItems
        .map(item => ({
            ...item,
            quantity: itemRemainingQuantities.get(item.itemId) || 0,
        }))
        .filter(item => item.quantity > 0);

    const unassignedCount = availableItems.length;

    const handleAddTruck = () => {
        const newTruck: Truck = {
            id: `truck-${Date.now()}`,
            number: trucks.length + 1,
            capacity: 5000,
            items: [],
            totalWeight: 0,
        };
        setTrucks([...trucks, newTruck]);
    };

    const handleAssignItem = (item: SiteItem) => {
        const selection = itemSelections.get(item.itemId);
        if (!selection || !selection.truckId) {
            error("Please select a truck");
            return;
        }

        const qty = selection.qty;
        if (!qty || qty <= 0) {
            error("Please enter a valid quantity");
            return;
        }

        const available = itemRemainingQuantities.get(item.itemId) || 0;
        if (qty > available) {
            error(`Only ${available} units available`);
            return;
        }

        const truck = trucks.find((t) => t.id === selection.truckId);
        if (!truck) return;

        if (truck.items.some((i) => i.itemId === item.itemId)) {
            error("Item already added to this truck");
            return;
        }

        const truckItem: TruckItem = {
            itemId: item.itemId,
            itemName: item.itemName,
            categoryName: item.categoryName,
            quantity: qty,
            weightPerUnit: item.weightPerUnit,
            totalWeight: qty * (item.weightPerUnit || 0),
        };

        setTrucks(trucks.map((t) =>
            t.id === selection.truckId
                ? { ...t, items: [...t.items, truckItem], totalWeight: t.totalWeight + truckItem.totalWeight }
                : t
        ));

        const newRemaining = new Map(itemRemainingQuantities);
        newRemaining.set(item.itemId, available - qty);
        setItemRemainingQuantities(newRemaining);

        // Clear selection for this item
        const newSelections = new Map(itemSelections);
        newSelections.delete(item.itemId);
        setItemSelections(newSelections);

        success(`Added ${qty} × ${item.itemName} to Truck ${truck.number}`);
    };

    const handleRemoveItem = (truckId: string, itemId: string) => {
        const truck = trucks.find((t) => t.id === truckId);
        if (!truck) return;

        const item = truck.items.find((i) => i.itemId === itemId);
        if (!item) return;

        setTrucks(trucks.map((t) =>
            t.id === truckId
                ? { ...t, items: t.items.filter((i) => i.itemId !== itemId), totalWeight: t.totalWeight - item.totalWeight }
                : t
        ));

        const newRemaining = new Map(itemRemainingQuantities);
        newRemaining.set(itemId, (newRemaining.get(itemId) || 0) + item.quantity);
        setItemRemainingQuantities(newRemaining);
    };

    const handleRemoveTruck = (truckId: string) => {
        const truck = trucks.find((t) => t.id === truckId);
        if (!truck) return;

        const newRemaining = new Map(itemRemainingQuantities);
        truck.items.forEach((item) => {
            newRemaining.set(item.itemId, (newRemaining.get(item.itemId) || 0) + item.quantity);
        });
        setItemRemainingQuantities(newRemaining);

        setTrucks(
            trucks.filter((t) => t.id !== truckId).map((t, index) => ({ ...t, number: index + 1 }))
        );
    };

    const handleCreateChallan = async (truckId: string) => {
        if (!selectedProjectId) {
            error("Please select a project first");
            return;
        }

        const truck = trucks.find((t) => t.id === truckId);
        if (!truck || truck.items.length === 0) return;

        setCreatingChallan(true);

        try {
            const response = await fetch("/api/challans/create-single", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: selectedProjectId,
                    siteId: siteId || null,
                    truck: {
                        capacity: truck.capacity,
                        items: truck.items.map((item) => ({
                            itemId: item.itemId,
                            quantity: item.quantity,
                        })),
                    },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                success(`Challan ${data.challanNumber} created successfully!`);
                handleRemoveTruck(truckId);
                router.push(`/dashboard/challans/${data.challanId}`);
            } else {
                const data = await response.json();
                error(data.error || "Failed to create challan");
            }
        } catch (err) {
            error(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setCreatingChallan(false);
        }
    };

    const handleCreateAllChallans = async () => {
        if (!selectedProjectId) {
            error("Please select a project first");
            return;
        }

        if (trucks.length === 0 || trucks.every((t) => t.items.length === 0)) {
            error("Please assign items to trucks first");
            return;
        }

        if (unassignedCount > 0) {
            const proceed = confirm(
                `⚠️ Warning: ${unassignedCount} item(s) are not assigned to any truck. Do you want to proceed anyway?`
            );
            if (!proceed) return;
        }

        setCreatingAll(true);

        try {
            const response = await fetch("/api/challans/bulk-create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: selectedProjectId,
                    siteId: siteId || null,
                    challanType: "DELIVERY",
                    trucks: trucks
                        .filter((t) => t.items.length > 0)
                        .map((t) => ({
                            capacity: t.capacity,
                            items: t.items.map((item) => ({
                                itemId: item.itemId,
                                quantity: item.quantity,
                            })),
                        })),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                success(data.message || "All challans created successfully!");
                router.push("/dashboard/challans");
                router.refresh();
            } else {
                const data = await response.json();
                error(data.error || "Failed to create challans");
            }
        } catch (err) {
            error(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setCreatingAll(false);
        }
    };

    if (itemsLoading || projectsLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header
                title="Generate Challans"
                subtitle={siteId ? "Assign items to trucks" : "Manual challan generation"}
                action={
                    <Link href="/dashboard/challans" className="btn btn-secondary">
                        ← Back to Challans
                    </Link>
                }
            />

            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Step 1: Project */}
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">1. Select Project</h2>
                        <select
                            className="input max-w-md"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            required
                        >
                            <option value="">Select destination project...</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - {p.location}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Kit Summary Panel */}
                    {kitGroups.length > 0 && (
                        <div className="card border border-amber-200 bg-amber-50">
                            <h2 className="text-lg font-semibold mb-3 text-amber-900">
                                ⛺ Tent Kits at this Site
                                <span className="ml-2 text-sm font-normal text-amber-700">
                                    (grouped view — assign individual items below)
                                </span>
                            </h2>
                            <div className="space-y-2">
                                {kitGroups.map((kg: KitGroup) => (
                                    <KitGroupCard key={kg.bundleTemplateId} kg={kg} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Assign Items */}
                    {siteItems.length === 0 ? (
                        <div className="card text-center py-12">
                            <div className="text-6xl mb-4">📦</div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Available</h3>
                            <p className="text-gray-600">There are no items deployed at this site.</p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">2. Assign Items to Trucks</h2>
                                <button onClick={handleAddTruck} className="btn btn-primary">
                                    + Add Truck
                                </button>
                            </div>

                            {trucks.length === 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <p className="text-blue-800 text-sm">Add at least one truck before assigning items.</p>
                                </div>
                            )}

                            {/* Items Table */}
                            {availableItems.length > 0 && (
                                <div className="overflow-x-auto mb-6">
                                    <table className="table w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="table-header" style={{ width: "25%" }}>Item</th>
                                                <th className="table-header" style={{ width: "15%" }}>Category</th>
                                                <th className="table-header text-center" style={{ width: "10%" }}>Available</th>
                                                <th className="table-header" style={{ width: "28%" }}>Assign to Truck</th>
                                                <th className="table-header text-center" style={{ width: "12%" }}>Qty</th>
                                                <th className="table-header" style={{ width: "10%" }}></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {availableItems.map((item) => {
                                                const sel = itemSelections.get(item.itemId) || { truckId: "", qty: 1 };
                                                return (
                                                    <tr key={item.itemId}>
                                                        <td className="table-cell font-medium">{item.itemName}</td>
                                                        <td className="table-cell text-gray-500 text-sm">{item.categoryName}</td>
                                                        <td className="table-cell text-center">
                                                            <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-semibold text-sm">
                                                                {item.quantity}
                                                            </span>
                                                        </td>
                                                        <td className="table-cell">
                                                            <select
                                                                className="input text-sm py-1 w-full"
                                                                value={sel.truckId}
                                                                disabled={trucks.length === 0}
                                                                onChange={(e) => {
                                                                    const newSel = new Map(itemSelections);
                                                                    newSel.set(item.itemId, { ...sel, truckId: e.target.value });
                                                                    setItemSelections(newSel);
                                                                }}
                                                            >
                                                                <option value="">Select truck...</option>
                                                                {trucks.map((t) => (
                                                                    <option key={t.id} value={t.id}>
                                                                        Truck {t.number}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="table-cell text-center">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={item.quantity}
                                                                value={sel.qty}
                                                                className="input text-sm py-1 w-full text-center"
                                                                onChange={(e) => {
                                                                    const newSel = new Map(itemSelections);
                                                                    newSel.set(item.itemId, { ...sel, qty: parseInt(e.target.value) || 1 });
                                                                    setItemSelections(newSel);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="table-cell">
                                                            <button
                                                                onClick={() => handleAssignItem(item)}
                                                                disabled={trucks.length === 0}
                                                                className="btn btn-primary btn-sm disabled:opacity-40"
                                                            >
                                                                Add
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {availableItems.length === 0 && trucks.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <p className="text-green-800 font-medium">✓ All items have been assigned to trucks</p>
                                </div>
                            )}

                            {/* Truck Cards */}
                            {trucks.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900">🚛 Trucks</h3>
                                    {trucks.map((truck) => (
                                        <div key={truck.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                                                <span className="font-semibold text-gray-900">Truck {truck.number}</span>
                                                <div className="flex gap-2">
                                                    {truck.items.length > 0 && (
                                                        <button
                                                            onClick={() => handleCreateChallan(truck.id)}
                                                            disabled={creatingChallan || !selectedProjectId}
                                                            className="btn btn-primary btn-sm disabled:opacity-40"
                                                        >
                                                            {creatingChallan ? "Creating..." : "📄 Create Challan"}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveTruck(truck.id)}
                                                        className="btn btn-secondary btn-sm text-red-600"
                                                    >
                                                        Remove Truck
                                                    </button>
                                                </div>
                                            </div>
                                            {truck.items.length === 0 ? (
                                                <p className="text-gray-400 text-sm text-center py-4">No items assigned yet</p>
                                            ) : (
                                                <table className="table w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="table-header">Item</th>
                                                            <th className="table-header">Category</th>
                                                            <th className="table-header text-center">Qty</th>
                                                            <th className="table-header"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {truck.items.map((item) => (
                                                            <tr key={item.itemId}>
                                                                <td className="table-cell font-medium">{item.itemName}</td>
                                                                <td className="table-cell text-gray-500 text-sm">{item.categoryName}</td>
                                                                <td className="table-cell text-center">{item.quantity}</td>
                                                                <td className="table-cell text-right">
                                                                    <button
                                                                        onClick={() => handleRemoveItem(truck.id, item.itemId)}
                                                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Create All */}
                    {trucks.length > 0 && trucks.some((t) => t.items.length > 0) && (
                        <div className="card">
                            <h2 className="text-lg font-semibold mb-4">3. Create Challans</h2>

                            {unassignedCount > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                                    <p className="text-orange-800 font-medium">
                                        ⚠️ {unassignedCount} item(s) not assigned to any truck
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCreateAllChallans}
                                    disabled={creatingAll || !selectedProjectId}
                                    className="btn btn-primary disabled:opacity-50"
                                >
                                    {creatingAll
                                        ? "Creating..."
                                        : `📄 Create All Challans (${trucks.filter((t) => t.items.length > 0).length} trucks)`}
                                </button>
                                <button
                                    onClick={() => router.push("/dashboard/challans")}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
