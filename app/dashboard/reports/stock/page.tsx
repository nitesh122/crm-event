import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function StockReportPage() {
  const items = await prisma.item.findMany({
    include: {
      category: true,
      subcategory: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const totalValue = items.reduce(
    (sum, item) => sum + (item.cost || 0) * item.quantityAvailable,
    0
  );

  return (
    <div>
      <Header
        title="Current Stock Report"
        subtitle="Complete inventory with stock levels"
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Quantity</p>
            <p className="text-2xl font-bold">
              {items.reduce((sum, item) => sum + item.quantityAvailable, 0)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Low Stock Items</p>
            <p className="text-2xl font-bold text-red-600">
              {items.filter((item) => item.quantityAvailable < 10).length}
            </p>
          </div>
        </div>

        {/* Stock Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Item Name</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Subcategory</th>
                  <th className="table-header">Available</th>
                  <th className="table-header">Condition</th>
                  <th className="table-header">Unit Cost</th>
                  <th className="table-header">Total Value</th>
                  <th className="table-header">Vendor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
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
                      {item.subcategory?.name || "—"}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`font-semibold ${
                          item.quantityAvailable < 10
                            ? "text-red-600"
                            : "text-green-600"
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
                            : item.condition === "REPAIR_NEEDED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.condition.replace("_", " ")}
                      </span>
                    </td>
                    <td className="table-cell">
                      {item.cost ? `₹${item.cost.toLocaleString()}` : "—"}
                    </td>
                    <td className="table-cell">
                      {item.cost
                        ? `₹${(item.cost * item.quantityAvailable).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="table-cell">{item.vendor || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
