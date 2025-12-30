'use client';

import { useState } from 'react';
import Link from 'next/link';

type Item = {
    id: string;
    name: string;
    quantityAvailable: number;
    condition: string;
    vendor: string | null;
    category: {
        id: string;
        name: string;
    };
    subcategory: {
        id: string;
        name: string;
    } | null;
};

type Category = {
    id: string;
    name: string;
};

export default function InventoryClient({
    items,
    categories,
    canManage,
}: {
    items: Item[];
    categories: Category[];
    canManage: boolean;
}) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Filter items based on selected category
    const filteredItems = selectedCategory
        ? items.filter((item) => item.category.id === selectedCategory)
        : items;

    return (
        <>
            {/* Quick Filters */}
            <div className="card mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedCategory === null
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All Items ({items.length})
                    </button>
                    {categories.map((cat) => {
                        const categoryItems = items.filter((item) => item.category.id === cat.id);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedCategory === cat.id
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name} ({categoryItems.length})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Items Table */}
            <div className="card">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="table-header">Item Name</th>
                                <th className="table-header">Category</th>
                                <th className="table-header">Subcategory</th>
                                <th className="table-header">Available Qty</th>
                                <th className="table-header">Condition</th>
                                <th className="table-header">Vendor</th>
                                <th className="table-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        {selectedCategory
                                            ? 'No items found in this category.'
                                            : 'No items found. Add your first item to get started.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="table-cell font-medium">{item.name}</td>
                                        <td className="table-cell">{item.category.name}</td>
                                        <td className="table-cell">
                                            {item.subcategory?.name || '—'}
                                        </td>
                                        <td className="table-cell">
                                            <span
                                                className={`font-semibold ${item.quantityAvailable < 10
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                    }`}
                                            >
                                                {item.quantityAvailable}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${item.condition === 'GOOD'
                                                        ? 'bg-green-100 text-green-800'
                                                        : item.condition === 'REPAIR_NEEDED'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {item.condition.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="table-cell">{item.vendor || '—'}</td>
                                        <td className="table-cell">
                                            <Link
                                                href={`/dashboard/inventory/${item.id}`}
                                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
