import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function LowStockReportPage() {
  const lowStockThreshold = 10;

  const lowStockItems = await prisma.item.findMany({
    where: {
      quantityAvailable: {
        lt: lowStockThreshold,
      },
    },
    include: {
      category: true,
      subcategory: true,
    },
    orderBy: {
      quantityAvailable: "asc",
    },
  });

  return (
    <div>
      <Header
        title="Low Stock Alert"
        subtitle={`Items with quantity below ${lowStockThreshold}`}
        action={
          <a
            href="/api/reports/export/stock?format=csv"
            className="btn btn-primary"
          >
            Export CSV
          </a>
        }
      />

      <div className="p-8">
        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center">
              <div className="bg-red-500 text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                ⚠️
              </div>
              <div>
                <p className="text-sm text-red-600">Critical Items</p>
                <p className="text-2xl font-bold text-red-800">
                  {lowStockItems.filter((item) => item.quantityAvailable === 0).length}
                </p>
                <p className="text-xs text-red-600">Out of stock</p>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <div className="bg-yellow-500 text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                ⚠️
              </div>
              <div>
                <p className="text-sm text-yellow-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {lowStockItems.filter((item) => item.quantityAvailable > 0 && item.quantityAvailable < 5).length}
                </p>
                <p className="text-xs text-yellow-600">Below 5 units</p>
              </div>
            </div>
          </div>

          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center">
              <div className="bg-orange-500 text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                📊
              </div>
              <div>
                <p className="text-sm text-orange-600">Total Alerts</p>
                <p className="text-2xl font-bold text-orange-800">
                  {lowStockItems.length}
                </p>
                <p className="text-xs text-orange-600">Need attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="card">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                All Stock Levels Good!
              </h3>
              <p className="text-gray-600">
                No items are currently below the low stock threshold of {lowStockThreshold} units.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Priority</th>
                    <th className="table-header">Item Name</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Current Stock</th>
                    <th className="table-header">Condition</th>
                    <th className="table-header">Vendor</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lowStockItems.map((item, index) => (
                    <tr key={item.id} className={item.quantityAvailable === 0 ? "bg-red-50" : ""}>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            item.quantityAvailable === 0
                              ? "bg-red-100 text-red-800"
                              : item.quantityAvailable < 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {item.quantityAvailable === 0 ? "CRITICAL" : item.quantityAvailable < 5 ? "LOW" : "MEDIUM"}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Link
                          href={`/dashboard/inventory/${item.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="table-cell">{item.category.name}</td>
                      <td className="table-cell">
                        <span
                          className={`font-bold text-lg ${
                            item.quantityAvailable === 0
                              ? "text-red-600"
                              : "text-orange-600"
                          }`}
                        >
                          {item.quantityAvailable}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.condition === "GOOD"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.condition.replace("_", " ")}
                        </span>
                      </td>
                      <td className="table-cell">{item.vendor || "—"}</td>
                      <td className="table-cell">
                        <Link
                          href={`/dashboard/stock-movements/new`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Add Stock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {lowStockItems.length > 0 && (
          <div className="card mt-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3 text-blue-900">📋 Recommendations</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {lowStockItems.filter((item) => item.quantityAvailable === 0).length > 0 && (
                <li>
                  • <strong>Critical:</strong> {lowStockItems.filter((item) => item.quantityAvailable === 0).length} item(s) are out of stock. Order immediately to avoid disruptions.
                </li>
              )}
              {lowStockItems.filter((item) => item.quantityAvailable > 0 && item.quantityAvailable < 5).length > 0 && (
                <li>
                  • <strong>Low Stock:</strong> {lowStockItems.filter((item) => item.quantityAvailable > 0 && item.quantityAvailable < 5).length} item(s) have less than 5 units. Plan for restocking soon.
                </li>
              )}
              <li>
                • Review vendor contacts and initiate purchase orders for critical items.
              </li>
              <li>
                • Consider increasing order quantities for frequently used items.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
