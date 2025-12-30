import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  // Get summary statistics
  const [
    totalItems,
    lowStockCount,
    totalMovements,
    pendingMaintenance,
    activeProjects,
    totalChallans,
  ] = await Promise.all([
    prisma.item.count(),
    prisma.item.count({ where: { quantityAvailable: { lt: 10 } } }),
    prisma.stockMovement.count(),
    prisma.maintenanceRecord.count({
      where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.challan.count(),
  ]);

  const reports = [
    {
      title: "Current Stock Report",
      description: "View all items with current stock levels and conditions",
      icon: "📦",
      href: "/dashboard/reports/stock",
      stats: `${totalItems} items`,
    },
    {
      title: "Low Stock Alert",
      description: "Items with quantity below threshold",
      icon: "⚠️",
      href: "/dashboard/reports/low-stock",
      stats: `${lowStockCount} items`,
      alert: lowStockCount > 0,
    },
    {
      title: "Stock Movement Log",
      description: "Complete history of inward, outward, and return movements",
      icon: "🔄",
      href: "/dashboard/reports/movements",
      stats: `${totalMovements} movements`,
    },
    {
      title: "Maintenance Pending",
      description: "Items requiring repair or maintenance",
      icon: "🔧",
      href: "/dashboard/reports/maintenance",
      stats: `${pendingMaintenance} items`,
      alert: pendingMaintenance > 0,
    },
    {
      title: "Project Allocation",
      description: "Items allocated to active and completed projects",
      icon: "🎯",
      href: "/dashboard/reports/project-allocation",
      stats: `${activeProjects} active`,
    },
    {
      title: "Challan History",
      description: "All delivery challans with project details",
      icon: "📋",
      href: "/dashboard/reports/challans",
      stats: `${totalChallans} challans`,
    },
  ];

  return (
    <div>
      <Header
        title="Reports & Analytics"
        subtitle="View comprehensive reports and export data"
      />

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start">
                <div
                  className={`text-3xl mr-4 ${
                    report.alert ? "animate-pulse" : ""
                  }`}
                >
                  {report.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    {report.title}
                    {report.alert && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Alert
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {report.description}
                  </p>
                  <p className="text-xs text-primary-600 font-medium">
                    {report.stats}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Export Section */}
        <div className="card mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Exports</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/reports/export/stock?format=csv"
              className="btn btn-secondary"
            >
              Export Current Stock (CSV)
            </a>
            <a
              href="/api/reports/export/movements?format=csv"
              className="btn btn-secondary"
            >
              Export Stock Movements (CSV)
            </a>
            <a
              href="/api/reports/export/challans?format=csv"
              className="btn btn-secondary"
            >
              Export Challans (CSV)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
