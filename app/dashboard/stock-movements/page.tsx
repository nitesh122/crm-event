import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { canCreateStockMovements } from "@/lib/permissions";

export default async function StockMovementsPage() {
  const session = await getServerSession(authOptions);
  const canManage = canCreateStockMovements(session!.user.role);

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
    take: 100, // Show last 100 movements
  });

  // Calculate summary
  const summary = {
    inward: movements.filter((m) => m.movementType === "INWARD").length,
    outward: movements.filter((m) => m.movementType === "OUTWARD").length,
    return: movements.filter((m) => m.movementType === "RETURN").length,
    total: movements.length,
  };

  return (
    <div>
      <Header
        title="Stock Movements"
        subtitle="Complete history of all inventory changes"
        action={
          canManage ? (
            <Link
              href="/dashboard/stock-movements/new"
              className="btn btn-primary"
            >
              + New Movement
            </Link>
          ) : undefined
        }
      />

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center">
              <div className="bg-green-500 text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                ↓
              </div>
              <div>
                <p className="text-sm text-gray-600">Inward</p>
                <p className="text-2xl font-bold">{summary.inward}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="bg-red-500 text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                ↑
              </div>
              <div>
                <p className="text-sm text-gray-600">Outward</p>
                <p className="text-2xl font-bold">{summary.outward}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="bg-blue-500 text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                ↩
              </div>
              <div>
                <p className="text-sm text-gray-600">Returns</p>
                <p className="text-2xl font-bold">{summary.return}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="bg-gray-500 text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                Σ
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Movements</p>
                <p className="text-2xl font-bold">{summary.total}</p>
              </div>
            </div>
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
                  <th className="table-header">Previous</th>
                  <th className="table-header">New</th>
                  <th className="table-header">Project</th>
                  <th className="table-header">Performed By</th>
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
                      <td className="table-cell text-xs">
                        {new Date(movement.createdAt).toLocaleString()}
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
                        <span className="font-semibold">
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
                              : "text-red-600"
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

          {movements.length === 100 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing last 100 movements. Use reports for complete history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
