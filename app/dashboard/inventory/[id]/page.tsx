import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

export default async function InventoryItemDetail({
  params,
}: {
  params: { id: string };
}) {
  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      subcategory: true,
    },
  });

  if (!item) {
    notFound();
  }

  const images = [item.imageUrl1, item.imageUrl2, item.imageUrl3].filter(
    Boolean
  );

  return (
    <div>
      <Header
        title={item.name}
        subtitle={`${item.category.name}${item.subcategory ? ` / ${item.subcategory.name}` : ""}`}
        action={
          <Link href="/dashboard/inventory" className="btn btn-secondary">
            ← Back to Inventory
          </Link>
        }
      />

      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Images Gallery */}
          {images.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Item Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url!}
                      alt={`${item.name} - Image ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Item Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Item Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Item Name
                </label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {item.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Category
                </label>
                <p className="text-lg text-gray-900 mt-1">
                  {item.category.name}
                </p>
              </div>
              {item.subcategory && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Subcategory
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {item.subcategory.name}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Quantity Available
                </label>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {item.quantityAvailable}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Condition
                </label>
                <p className="mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${item.condition === "GOOD"
                        ? "bg-green-100 text-green-800"
                        : item.condition === "REPAIR_NEEDED"
                          ? "bg-yellow-100 text-yellow-800"
                          : item.condition === "DAMAGED"
                            ? "bg-red-100 text-red-800"
                            : item.condition === "SCRAP"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {item.condition.replace("_", " ")}
                  </span>
                </p>
              </div>
              {item.cost && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Cost per Unit
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    ₹{parseFloat(item.cost.toString()).toFixed(2)}
                  </p>
                </div>
              )}
              {item.vendor && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Vendor
                  </label>
                  <p className="text-lg text-gray-900 mt-1">{item.vendor}</p>
                </div>
              )}
              {item.currentLocation && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Current Location
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {item.currentLocation}
                  </p>
                </div>
              )}
            </div>

            {item.description && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-600">
                  Description
                </label>
                <p className="text-gray-900 mt-2">{item.description}</p>
              </div>
            )}

            {item.remarks && (
              <div className="mt-6 pt-6 border-t">
                <label className="text-sm font-medium text-gray-600">
                  Remarks
                </label>
                <p className="text-gray-900 mt-2">{item.remarks}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card bg-gray-50">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/stock-movements/new?itemId=${item.id}`}
                className="btn btn-primary"
              >
                Record Movement
              </Link>
              <Link
                href={`/dashboard/repairs/new?itemId=${item.id}`}
                className="btn btn-secondary"
              >
                Report Repair
              </Link>
              <Link
                href={`/dashboard/scrap/new?itemId=${item.id}`}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Mark as Scrap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
