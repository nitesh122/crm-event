import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function MaintenanceReportPage() {
  const maintenanceRecords = await prisma.maintenanceRecord.findMany({
    include: {
      item: {
        include: {
          category: true,
        },
      },
      assignedTo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: maintenanceRecords.length,
    pending: maintenanceRecords.filter((r) => r.status === "PENDING").length,
    inProgress: maintenanceRecords.filter((r) => r.status === "IN_PROGRESS").length,
    completed: maintenanceRecords.filter((r) => r.status === "COMPLETED").length,
  };

  return (
    <div>
      <Header
        title="Maintenance Report"
        subtitle="Track items requiring repair or maintenance"
      />

      <div className="p-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="card border-red-200 bg-red-50">
            <p className="text-sm text-red-600">Pending</p>
            <p className="text-2xl font-bold text-red-700">{stats.pending}</p>
          </div>
          <div className="card border-yellow-200 bg-yellow-50">
            <p className="text-sm text-yellow-600">In Progress</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.inProgress}</p>
          </div>
          <div className="card border-green-200 bg-green-50">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
          </div>
        </div>

        {/* Maintenance Records Table */}
        <div className="card">
          {maintenanceRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Maintenance Records
              </h3>
              <p className="text-gray-600">
                All items are in good condition. No repairs needed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Status</th>
                    <th className="table-header">Item</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Current Stock</th>
                    <th className="table-header">Condition</th>
                    <th className="table-header">Assigned To</th>
                    <th className="table-header">Created</th>
                    <th className="table-header">Notes</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {maintenanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            record.status === "PENDING"
                              ? "bg-red-100 text-red-800"
                              : record.status === "IN_PROGRESS"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {record.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Link
                          href={`/dashboard/inventory/${record.item.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {record.item.name}
                        </Link>
                      </td>
                      <td className="table-cell">{record.item.category.name}</td>
                      <td className="table-cell">
                        <span
                          className={`font-semibold ${
                            record.item.quantityAvailable < 10
                              ? "text-red-600"
                              : "text-gray-900"
                          }`}
                        >
                          {record.item.quantityAvailable}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            record.item.condition === "GOOD"
                              ? "bg-green-100 text-green-800"
                              : record.item.condition === "REPAIR_NEEDED"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.item.condition.replace("_", " ")}
                        </span>
                      </td>
                      <td className="table-cell text-xs">
                        {record.assignedTo?.name || "Unassigned"}
                      </td>
                      <td className="table-cell text-xs">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-xs text-gray-600 max-w-xs truncate">
                        {record.notes || "—"}
                      </td>
                      <td className="table-cell">
                        <Link
                          href={`/dashboard/inventory/${record.item.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Items */}
        {(stats.pending > 0 || stats.inProgress > 0) && (
          <div className="card mt-6 bg-orange-50 border-orange-200">
            <h3 className="font-semibold mb-3 text-orange-900">🔧 Action Required</h3>
            <ul className="space-y-2 text-sm text-orange-800">
              {stats.pending > 0 && (
                <li>
                  • <strong>{stats.pending}</strong> item(s) pending maintenance. Assign to team members and prioritize repairs.
                </li>
              )}
              {stats.inProgress > 0 && (
                <li>
                  • <strong>{stats.inProgress}</strong> item(s) currently being repaired. Follow up on completion status.
                </li>
              )}
              <li>
                • Review item conditions after maintenance and update stock records accordingly.
              </li>
              <li>
                • Items marked as DAMAGED may need replacement. Consider procurement options.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
