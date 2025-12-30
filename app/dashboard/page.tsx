import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Fetch dashboard statistics
  const [
    totalItems,
    lowStockItems,
    activeProjects,
    pendingMaintenance,
    recentMovements,
  ] = await Promise.all([
    prisma.item.count(),
    prisma.item.count({
      where: {
        quantityAvailable: {
          lt: 10,
        },
      },
    }),
    prisma.project.count({
      where: {
        status: "ACTIVE",
      },
    }),
    prisma.maintenanceRecord.count({
      where: {
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    }),
    prisma.stockMovement.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        item: true,
        project: true,
        performedBy: true,
      },
    }),
  ]);

  const stats = [
    {
      label: "Total Items",
      value: totalItems,
      icon: "📦",
      color: "bg-blue-500",
    },
    {
      label: "Low Stock Items",
      value: lowStockItems,
      icon: "⚠️",
      color: "bg-yellow-500",
    },
    {
      label: "Active Projects",
      value: activeProjects,
      icon: "🎯",
      color: "bg-green-500",
    },
    {
      label: "Pending Maintenance",
      value: pendingMaintenance,
      icon: "🔧",
      color: "bg-red-500",
    },
  ];

  return (
    <div>
      <Header
        title={`Welcome back, ${session?.user.name}!`}
        subtitle="Here's what's happening with your inventory"
      />

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="card">
              <div className="flex items-center">
                <div
                  className={`${stat.color} text-white text-2xl w-12 h-12 rounded-lg flex items-center justify-center mr-4`}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Stock Movements</h2>
          {recentMovements.length === 0 ? (
            <p className="text-gray-500">No recent movements</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Item</th>
                    <th className="table-header">Quantity</th>
                    <th className="table-header">Project</th>
                    <th className="table-header">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="table-cell">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
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
                      <td className="table-cell">{movement.item.name}</td>
                      <td className="table-cell">{movement.quantity}</td>
                      <td className="table-cell">
                        {movement.project?.name || "—"}
                      </td>
                      <td className="table-cell">{movement.performedBy.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4">
            <Link
              href="/dashboard/stock-movements"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all movements →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
