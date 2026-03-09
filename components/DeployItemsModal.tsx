"use client";

import { useState, useEffect } from "react";
import CategoryItemDropdown from "@/components/CategoryItemDropdown";
import TentKitSelector from "@/components/TentKitSelector";
import { useToast } from "@/lib/hooks/useToast";

// ── Types ─────────────────────────────────────────────────────────────────────

type InventoryItem = {
    id: string;
    name: string;
    quantityAvailable: number;
    category: { id: string; name: string };
    subcategory: { id: string; name: string } | null;
};

/** A component within a kit card (editable quantity) */
type KitComponent = {
    itemId: string;
    itemName: string;
    componentType: string | null;
    quantityPerKit: number;       // base qty per 1 kit
    quantityDeployed: number;     // editable total qty to deploy
    availableQuantity: number;
};

/** A tent kit added to the deploy list — shown as one card */
type KitCard = {
    bundleId: string;         // BundleTemplate.id
    kitName: string;
    kitQty: number;           // number of complete kits (informational)
    components: KitComponent[];
};

/** An individually-added non-kit inventory item */
type IndividualItem = {
    itemId: string;
    itemName: string;
    quantityDeployed: number;
    availableQuantity: number;
    shiftType: "WAREHOUSE" | "SITE";
    expectedReturnDate?: string;
    notes?: string;
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface DeployItemsModalProps {
    siteId: string;
    siteName: string;
    onClose: () => void;
    onSuccess: () => void;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DeployItemsModal({
    siteId,
    siteName,
    onClose,
    onSuccess,
}: DeployItemsModalProps) {
    const { success, error } = useToast();

    // Modal view state
    const [view, setView] = useState<"main" | "editKit">("main");
    const [editingKitIndex, setEditingKitIndex] = useState<number | null>(null);

    // Data
    const [allItems, setAllItems] = useState<InventoryItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [kitCards, setKitCards] = useState<KitCard[]>([]);
    const [individualItems, setIndividualItems] = useState<IndividualItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Temp state for kit edit view (so Back saves, not discards)
    const [editingComponents, setEditingComponents] = useState<KitComponent[]>([]);

    useEffect(() => {
        fetch("/api/inventory/items?all=true&showKitComponents=true")
            .then((r) => r.json())
            .then((data) => setAllItems(data.data || []))
            .catch(console.error)
            .finally(() => setLoadingItems(false));
    }, []);

    // ── Kit Handlers ────────────────────────────────────────────────────────

    /** Called by TentKitSelector when user clicks "Add N × Kit" */
    const handleAddKit = (kit: {
        bundleId: string;
        kitName: string;
        kitQty: number;
        components: KitComponent[];
    }) => {
        // Merge if same bundle already added
        setKitCards((prev) => {
            const idx = prev.findIndex((k) => k.bundleId === kit.bundleId);
            if (idx >= 0) {
                // Replace with new quantities
                const updated = [...prev];
                updated[idx] = kit;
                return updated;
            }
            return [...prev, kit];
        });
    };

    /** Open the component edit sub-view for a kit card */
    const handleEditKit = (index: number) => {
        setEditingKitIndex(index);
        setEditingComponents([...kitCards[index].components.map((c) => ({ ...c }))]);
        setView("editKit");
    };

    /** Save edits and go back to main */
    const handleBackFromEdit = () => {
        if (editingKitIndex !== null) {
            setKitCards((prev) =>
                prev.map((k, i) =>
                    i === editingKitIndex ? { ...k, components: editingComponents } : k
                )
            );
        }
        setView("main");
        setEditingKitIndex(null);
        setEditingComponents([]);
    };

    const updateComponentQty = (itemId: string, qty: number) => {
        setEditingComponents((prev) =>
            prev.map((c) => (c.itemId === itemId ? { ...c, quantityDeployed: Math.max(0, qty) } : c))
        );
    };

    const handleRemoveKit = (index: number) => {
        setKitCards((prev) => prev.filter((_, i) => i !== index));
    };

    // ── Individual Item Handlers ───────────────────────────────────────────

    const handleAddItem = () => {
        if (!selectedItemId) return;
        if (individualItems.find((d) => d.itemId === selectedItemId)) {
            error("This item is already in the list");
            setSelectedItemId("");
            return;
        }
        const item = allItems.find((i) => i.id === selectedItemId);
        if (!item) return;
        setIndividualItems((prev) => [
            ...prev,
            {
                itemId: item.id,
                itemName: item.name,
                quantityDeployed: 1,
                availableQuantity: item.quantityAvailable,
                shiftType: "SITE",
            },
        ]);
        setSelectedItemId("");
    };

    const handleRemoveItem = (itemId: string) => {
        setIndividualItems((prev) => prev.filter((d) => d.itemId !== itemId));
    };

    const updateField = <K extends keyof IndividualItem>(
        itemId: string,
        field: K,
        value: IndividualItem[K]
    ) => {
        setIndividualItems((prev) =>
            prev.map((d) => (d.itemId === itemId ? { ...d, [field]: value } : d))
        );
    };

    // ── Submit ─────────────────────────────────────────────────────────────

    const totalDeployCount = kitCards.reduce((s, k) => s + k.components.length, 0) + individualItems.length;

    const handleSubmit = async () => {
        if (totalDeployCount === 0) {
            error("Add at least one kit or item to deploy");
            return;
        }

        // Build flat deployedItems list from all kit components + individual items
        const deployedItems = [
            ...kitCards.flatMap((kit) =>
                kit.components.map((comp) => ({
                    itemId: comp.itemId,
                    quantityDeployed: comp.quantityDeployed,
                    shiftType: "SITE" as const,
                }))
            ),
            ...individualItems.map((item) => ({
                itemId: item.itemId,
                quantityDeployed: item.quantityDeployed,
                shiftType: item.shiftType,
                expectedReturnDate: item.expectedReturnDate,
                notes: item.notes,
            })),
        ];

        setSubmitting(true);
        try {
            const res = await fetch(`/api/sites/${siteId}/deploy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deployedItems }),
            });
            const data = await res.json();
            if (res.ok) {
                success(data.message || "Items deployed successfully!");
                onSuccess();
                onClose();
            } else {
                error(data.error || "Failed to deploy items");
            }
        } catch (err) {
            console.error(err);
            error("An error occurred while deploying items");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render: Component Edit View (View 2) ──────────────────────────────

    if (view === "editKit" && editingKitIndex !== null) {
        const kit = kitCards[editingKitIndex];
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b bg-amber-50 rounded-t-2xl">
                        <div>
                            <h2 className="text-lg font-bold text-amber-900">⛺ Edit Components</h2>
                            <p className="text-sm text-amber-700 mt-0.5">{kit.kitName}</p>
                        </div>
                        <button
                            onClick={handleBackFromEdit}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Component list */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        <p className="text-xs text-gray-500 mb-2">
                            Adjust component quantities before deploying.
                        </p>
                        {editingComponents.map((comp) => {
                            const overStock = comp.quantityDeployed > comp.availableQuantity;
                            return (
                                <div key={comp.itemId} className="border rounded-xl p-4 bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{comp.itemName}</p>
                                            {comp.componentType && (
                                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">
                                                    {comp.componentType}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {comp.availableQuantity} available
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-xs font-medium text-gray-600">Quantity:</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={comp.availableQuantity}
                                            value={comp.quantityDeployed}
                                            onChange={(e) =>
                                                updateComponentQty(comp.itemId, parseInt(e.target.value) || 0)
                                            }
                                            className={`input text-sm w-24 ${overStock ? "border-red-400 ring-1 ring-red-400" : ""}`}
                                        />
                                        {overStock && (
                                            <p className="text-xs text-red-600">Exceeds stock!</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer — Back button saves */}
                    <div className="px-6 py-4 border-t bg-white rounded-b-2xl">
                        <button
                            onClick={handleBackFromEdit}
                            className="btn btn-primary w-full"
                        >
                            ← Save & Back to Deploy
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-2">
                            Changes are saved automatically when you go back.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Render: Main View (View 1) ─────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Deploy Items to Site</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{siteName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

                    {/* Tent Kit Selector */}
                    <TentKitSelector
                        onAddKit={handleAddKit}
                        existingBundleIds={kitCards.map((k) => k.bundleId)}
                    />

                    {/* Kit Cards List */}
                    {kitCards.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                ⛺ Tent Kits to Deploy
                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">
                                    {kitCards.length}
                                </span>
                            </h4>
                            {kitCards.map((kit, idx) => (
                                <div
                                    key={kit.bundleId}
                                    className="border border-amber-200 rounded-xl p-4 bg-amber-50 flex items-center justify-between"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{kit.kitName}</p>
                                        <p className="text-xs text-amber-700 mt-0.5">
                                            ×{kit.kitQty} kit{kit.kitQty !== 1 ? "s" : ""} · {kit.components.length} components
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditKit(idx)}
                                            title="Edit component quantities"
                                            className="p-2 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-200 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleRemoveKit(idx)}
                                            title="Remove kit"
                                            className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                            or add individual item
                        </span>
                        <div className="flex-1 border-t border-gray-200" />
                    </div>

                    {/* Individual Item Selector */}
                    {loadingItems ? (
                        <div className="text-sm text-gray-400 text-center py-2">Loading items...</div>
                    ) : (
                        <div className="flex gap-3">
                            <CategoryItemDropdown
                                items={allItems}
                                selectedItemId={selectedItemId}
                                onSelectItem={setSelectedItemId}
                                placeholder="Select an item to deploy..."
                            />
                            <button
                                type="button"
                                onClick={handleAddItem}
                                disabled={!selectedItemId}
                                className="btn btn-secondary disabled:opacity-50 whitespace-nowrap"
                            >
                                + Add Item
                            </button>
                        </div>
                    )}

                    {/* Individual Items List */}
                    {individualItems.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                📦 Individual Items
                                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-bold">
                                    {individualItems.length}
                                </span>
                            </h4>
                            {individualItems.map((item) => (
                                <div key={item.itemId} className="border rounded-xl p-4 bg-gray-50 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{item.itemName}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {item.availableQuantity} available in stock
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.itemId)}
                                            className="text-red-400 hover:text-red-600 text-sm p-1 rounded hover:bg-red-50 transition"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 block mb-1">
                                                Quantity <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={item.availableQuantity}
                                                value={item.quantityDeployed}
                                                onChange={(e) =>
                                                    updateField(item.itemId, "quantityDeployed", Math.max(1, parseInt(e.target.value) || 1))
                                                }
                                                className={`input text-sm ${item.quantityDeployed > item.availableQuantity
                                                    ? "border-red-400 ring-1 ring-red-400"
                                                    : ""
                                                    }`}
                                            />
                                            {item.quantityDeployed > item.availableQuantity && (
                                                <p className="text-xs text-red-600 mt-1">Exceeds available stock!</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 block mb-1">
                                                Expected Return
                                            </label>
                                            <input
                                                type="date"
                                                value={item.expectedReturnDate || ""}
                                                onChange={(e) => updateField(item.itemId, "expectedReturnDate", e.target.value)}
                                                className="input text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                                        <input
                                            type="text"
                                            placeholder="Optional notes for this item"
                                            value={item.notes || ""}
                                            onChange={(e) => updateField(item.itemId, "notes", e.target.value)}
                                            className="input text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {kitCards.length === 0 && individualItems.length === 0 && !loadingItems && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Select a tent kit above or add individual items to deploy
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex gap-3 bg-white rounded-b-2xl">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || totalDeployCount === 0}
                        className="btn btn-primary flex-1 disabled:opacity-50"
                    >
                        {submitting
                            ? "Deploying..."
                            : totalDeployCount > 0
                                ? `🚚 Deploy (${kitCards.length > 0 ? `${kitCards.length} kit${kitCards.length > 1 ? "s" : ""}` : ""}${kitCards.length > 0 && individualItems.length > 0 ? " + " : ""}${individualItems.length > 0 ? `${individualItems.length} item${individualItems.length > 1 ? "s" : ""}` : ""})`
                                : "Deploy Items"}
                    </button>
                    <button onClick={onClose} className="btn btn-secondary flex-1">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
