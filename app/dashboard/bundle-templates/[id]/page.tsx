import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function BundleTemplateDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await getServerSession(authOptions);

    const template = await prisma.bundleTemplate.findUnique({
        where: { id: params.id },
        include: {
            baseItem: {
                include: {
                    category: true,
                    subcategory: true,
                },
            },
            items: {
                include: {
                    item: {
                        include: {
                            category: true,
                            subcategory: true,
                        },
                    },
                },
            },
        },
    });

    if (!template) {
        notFound();
    }

    return (
        <div>
            <Header
                title={template.name}
                subtitle="Bundle Template Details"
                action={
                    <Link href="/dashboard/bundle-templates" className="btn btn-secondary">
                        ← Back to Templates
                    </Link>
                }
            />

            <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Template Info Card */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Template Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                                        Template Name
                                    </label>
                                    <p className="text-sm font-medium">{template.name}</p>
                                </div>

                                {template.description && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                                            Description
                                        </label>
                                        <p className="text-sm text-gray-700">{template.description}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                                        Base Item
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm font-medium">{template.baseItem.name}</p>
                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                            {template.baseItem.category.name}
                                            {template.baseItem.subcategory &&
                                                ` › ${template.baseItem.subcategory.name}`}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                                        Created
                                    </label>
                                    <p className="text-sm text-gray-700">
                                        {new Date(template.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bundled Items */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Bundled Items</h3>
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="table-header">Item Name</th>
                                            <th className="table-header">Category</th>
                                            <th className="table-header">Subcategory</th>
                                            <th className="table-header">Qty per Base Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {template.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-gray-500 text-sm">
                                                    No items in this bundle
                                                </td>
                                            </tr>
                                        ) : (
                                            template.items.map((bundleItem) => (
                                                <tr key={bundleItem.id}>
                                                    <td className="table-cell font-medium">
                                                        {bundleItem.item.name}
                                                    </td>
                                                    <td className="table-cell">
                                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                                            {bundleItem.item.category.name}
                                                        </span>
                                                    </td>
                                                    <td className="table-cell">
                                                        {bundleItem.item.subcategory?.name || "—"}
                                                    </td>
                                                    <td className="table-cell">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {bundleItem.quantityPerBaseUnit}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total Items</span>
                                    <span className="text-lg font-bold text-primary-600">
                                        {template.items.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Base Item Qty</span>
                                    <span className="text-lg font-bold text-gray-900">
                                        {template.baseItem.quantityAvailable}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Example Calculation */}
                        <div className="card bg-green-50 border-green-200">
                            <h3 className="text-sm font-semibold mb-3 text-green-900">
                                💡 Example Allocation
                            </h3>
                            <p className="text-xs text-green-800 mb-3">
                                If you allocate <strong>5</strong> units of{" "}
                                <strong>{template.baseItem.name}</strong>:
                            </p>
                            <div className="space-y-2">
                                {template.items.slice(0, 3).map((bundleItem) => (
                                    <div
                                        key={bundleItem.id}
                                        className="flex justify-between items-center text-xs"
                                    >
                                        <span className="text-green-700 truncate max-w-[140px]">
                                            {bundleItem.item.name}
                                        </span>
                                        <span className="font-bold text-green-900">
                                            {bundleItem.quantityPerBaseUnit * 5}
                                        </span>
                                    </div>
                                ))}
                                {template.items.length > 3 && (
                                    <p className="text-xs text-green-600 italic">
                                        + {template.items.length - 3} more items...
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="card bg-blue-50 border-blue-200">
                            <div className="flex items-start gap-2">
                                <div className="text-lg">ℹ️</div>
                                <div>
                                    <p className="text-xs font-medium text-blue-900 mb-1">
                                        About Bundles
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        Use this template when creating challans or allocating items to
                                        projects for faster processing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
