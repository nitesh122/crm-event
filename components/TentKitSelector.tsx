"use client";

import { useState, useEffect } from "react";

type KitComponent = {
    id: string;
    name: string;
    componentType: string | null;
    quantityPerKit: number;
    availableQuantity: number;
    availableKits: number;
};

type TentKit = {
    id: string;             // BundleTemplate.id
    name: string;
    subcategory: string | null;
    availableKits: number;
    isBalanced: boolean;
    components: KitComponent[];
};

/** Payload passed to onAddKit when user confirms a kit selection */
export type KitAddPayload = {
    bundleId: string;
    kitName: string;
    kitQty: number;
    components: {
        itemId: string;
        itemName: string;
        componentType: string | null;
        quantityPerKit: number;
        quantityDeployed: number;   // = quantityPerKit * kitQty
        availableQuantity: number;
    }[];
};

interface TentKitSelectorProps {
    /** Called when user clicks "Add N × Kit" */
    onAddKit: (kit: KitAddPayload) => void;
    /** BundleTemplate IDs already added — used to show "already added" state */
    existingBundleIds?: string[];
}

export default function TentKitSelector({
    onAddKit,
    existingBundleIds = [],
}: TentKitSelectorProps) {
    const [kits, setKits] = useState<TentKit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKit, setSelectedKit] = useState<TentKit | null>(null);
    const [kitQty, setKitQty] = useState(1);
    const [expanded, setExpanded] = useState(true); // expanded by default

    useEffect(() => {
        fetch("/api/tent-kits")
            .then((r) => r.json())
            .then((data) => setKits(data.kits || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSelectKit = (kit: TentKit) => {
        setSelectedKit(kit);
        setKitQty(1);
    };

    const handleAddKit = () => {
        if (!selectedKit || kitQty < 1) return;

        const payload: KitAddPayload = {
            bundleId: selectedKit.id,
            kitName: selectedKit.name,
            kitQty,
            components: selectedKit.components.map((comp) => ({
                itemId: comp.id,
                itemName: comp.name,
                componentType: comp.componentType,
                quantityPerKit: comp.quantityPerKit,
                quantityDeployed: comp.quantityPerKit * kitQty,
                availableQuantity: comp.availableQuantity,
            })),
        };

        onAddKit(payload);
        setSelectedKit(null);
        setKitQty(1);
        setExpanded(false); // collapse after adding
    };

    const maxKitsForSelected = selectedKit
        ? Math.min(selectedKit.availableKits, 999)
        : 0;

    return (
        <div className="border border-amber-200 rounded-xl bg-amber-50 overflow-hidden">
            {/* Header / Toggle */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100 transition"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl">⛺</span>
                    <span className="font-semibold text-amber-900 text-sm">
                        Add Complete Tent Kit
                    </span>
                    <span className="text-xs text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                        Auto-adds all components
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 text-amber-700 transition-transform ${expanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-amber-200">
                    {loading ? (
                        <div className="py-6 text-center text-sm text-amber-700">Loading tent kits...</div>
                    ) : kits.length === 0 ? (
                        <div className="py-6 text-center text-sm text-amber-700">
                            No tent kits found. Please set them up in{" "}
                            <a href="/dashboard/tent-kits" target="_blank" className="underline font-medium">
                                Tent Kits management
                            </a>
                            .
                        </div>
                    ) : (
                        <div className="mt-3 space-y-3">
                            {/* Kit Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {kits.map((kit) => {
                                    const isSelected = selectedKit?.id === kit.id;
                                    const hasStock = kit.availableKits > 0;
                                    const alreadyAdded = existingBundleIds.includes(kit.id);
                                    return (
                                        <button
                                            key={kit.id}
                                            type="button"
                                            disabled={!hasStock}
                                            onClick={() => handleSelectKit(isSelected ? null! : kit)}
                                            className={`text-left p-3 rounded-lg border-2 transition-all ${isSelected
                                                ? "border-amber-500 bg-amber-100 shadow-md"
                                                : hasStock
                                                    ? "border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50"
                                                    : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-1">
                                                <p className="font-semibold text-sm text-gray-900 leading-tight">{kit.name}</p>
                                                {isSelected && (
                                                    <span className="text-amber-600 text-lg leading-none">✓</span>
                                                )}
                                            </div>
                                            {kit.subcategory && (
                                                <p className="text-xs text-gray-500 mt-0.5">{kit.subcategory}</p>
                                            )}
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-xs text-gray-500">
                                                    {kit.components.length} components
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {alreadyAdded && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">✓ added</span>
                                                    )}
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hasStock
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-600"
                                                        }`}>
                                                        {kit.availableKits} avail
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Selected Kit Qty + Confirm */}
                            {selectedKit && (
                                <div className="mt-3 p-4 bg-white rounded-lg border border-amber-300 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900 text-sm">
                                            {selectedKit.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-600">No. of tents:</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={maxKitsForSelected}
                                                value={kitQty}
                                                onChange={(e) => setKitQty(Math.max(1, Math.min(maxKitsForSelected, parseInt(e.target.value) || 1)))}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center font-semibold focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Component preview */}
                                    <div className="mb-3 bg-amber-50 rounded-lg p-3">
                                        <p className="text-xs font-medium text-amber-800 mb-2">
                                            Will add {selectedKit.components.length} components:
                                        </p>
                                        <div className="space-y-1">
                                            {selectedKit.components.map((comp) => {
                                                const totalQty = comp.quantityPerKit * kitQty;
                                                const hasEnough = comp.availableQuantity >= totalQty;
                                                return (
                                                    <div
                                                        key={comp.id}
                                                        className={`flex justify-between items-center text-xs py-1 px-2 rounded ${!hasEnough ? "bg-red-50 text-red-700" : "text-gray-700"}`}
                                                    >
                                                        <span className="flex items-center gap-1 flex-1">
                                                            {comp.name}
                                                            {comp.componentType && (
                                                                <span className="text-xs font-medium bg-gray-200 text-gray-600 px-1 py-0.5 rounded">
                                                                    {comp.componentType}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold">×{totalQty}</span>
                                                            {!hasEnough && (
                                                                <span className="text-red-600 font-medium">
                                                                    (only {comp.availableQuantity} in stock)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* You can still edit quantities after adding via the ✏️ button */}
                                    <p className="text-xs text-gray-400 mb-3">
                                        ✏️ You can adjust individual component quantities after adding.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={handleAddKit}
                                        className="w-full btn btn-primary text-sm py-2"
                                    >
                                        ⛺ Add {kitQty} × {selectedKit.name}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
