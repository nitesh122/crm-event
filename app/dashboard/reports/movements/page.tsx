import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function MovementsReportPage() {
  const movements = await prisma.stockMovement.findMany({
    include: {
      item: {
        include: {
          category: true,
        },
      },
      project: true,
      performedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200, // Show last 200 movements
  });

  // Calculate statistics
  const stats = {
    total: movements.length,
    inward: movements.filter((m) => m.movementType === "INWARD").length,
    outward: movements.filter((m) => m.movementType === "OUTWARD").length,
    return: movements.filter((m) => m.movementType === "RETURN").length,
    totalQuantityMoved: movements.reduce((sum, m) => sum + m.quantity, 0),
  };

  return (
    <div>
      <Header
        title="Stock Movement Log"
        subtitle="Complete audit trail of all inventory changes"
        action={
          <a
            href="/api/reports/export/movements?format=csv"
            className="btn btn-primary"
          >
            Export CSV
          </a>
        }
      />

      <div className="p-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total Movements</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Inward</p>
            <p className="text-2xl font-bold text-green-600">{stats.inward}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Outward</p>
            <p className="text-2xl font-bold text-red-600">{stats.outward}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Returns</p>
            <p className="text-2xl font-bold text-blue-600">{stats.return}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Units Moved</p>
            <p className="text-2xl font-bold">{stats.totalQuantityMoved}</p>
          </div>
        </div>

        {/* Movements Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Date & Time</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Item</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Quantity</th>
                  <th className="table-header">Before</th>
                  <th className="table-header">After</th>
                  <th className="table-header">Project</th>
                  <th className="table-header">User</th>
                  <th className="table-header">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-500">
                      No stock movements found.
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="table-cell text-xs whitespace-nowrap">
                        {new Date(movement.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            movement.movementType === "INWARD"
                              ? "bg-green-100 text-green-800"
                              : movement.movementType === "OUTWARD"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {movement.movementType}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Link
                          href={`/dashboard/inventory/${movement.item.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {movement.item.name}
                        </Link>
                      </td>
                      <td className="table-cell text-xs">
                        {movement.item.category.name}
                      </td>
                      <td className="table-cell">
                        <span className="font-semibold text-gray-900">
                          {movement.quantity}
                        </span>
                      </td>
                      <td className="table-cell text-gray-600">
                        {movement.previousQuantity}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`font-semibold ${
                            movement.newQuantity > movement.previousQuantity
                              ? "text-green-600"
                              : movement.newQuantity < movement.previousQuantity
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {movement.newQuantity}
                        </span>
                      </td>
                      <td className="table-cell text-xs">
                        {movement.project ? (
                          <Link
                            href={`/dashboard/projects/${movement.project.id}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {movement.project.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="table-cell text-xs">
                        {movement.performedBy.name}
                      </td>
                      <td className="table-cell text-xs text-gray-600 max-w-xs truncate">
                        {movement.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {movements.length === 200 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing last 200 movements. Contact support for complete history export.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
