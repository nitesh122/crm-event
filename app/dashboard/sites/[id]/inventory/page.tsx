import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

export default async function SiteInventoryPage({
  params,
}: {
  params: { id: string };
}) {
  const site = await prisma.site.findUnique({
    where: { id: params.id },
  });

  if (!site) {
    notFound();
  }

  const siteInventory = await prisma.siteInventory.findMany({
    where: { siteId: params.id },
    include: {
      item: {
        include: {
          category: true,
          subcategory: true,
        },
      },
    },
    orderBy: {
      deployedDate: "desc",
    },
  });

  const summary = {
    totalItems: siteInventory.length,
    totalQuantity: siteInventory.reduce((sum, inv) => sum + inv.quantityDeployed, 0),
    currentlyDeployed: siteInventory.filter((inv) => !inv.actualReturnDate).length,
    returned: siteInventory.filter((inv) => inv.actualReturnDate).length,
    overdue: siteInventory.filter(
      (inv) =>
        !inv.actualReturnDate &&
        inv.expectedReturnDate &&
        new Date(inv.expectedReturnDate) < new Date()
    ).length,
  };

  return (
    <div>
      <Header
        title={`${site.name} - Inventory`}
        subtitle="Items deployed at this site"
        action={
          <Link href={`/dashboard/sites/${site.id}`} className="btn btn-secondary">
            ← Back to Site
          </Link>
        }
      />

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Unique Items</p>
            <p className="text-2xl font-bold">{summary.totalItems}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Quantity</p>
            <p className="text-2xl font-bold">{summary.totalQuantity}</p>
          </div>
          <div className="card border-orange-200 bg-orange-50">
            <p className="text-sm text-orange-600">Currently Deployed</p>
            <p className="text-2xl font-bold text-orange-700">
              {summary.currentlyDeployed}
            </p>
          </div>
          <div className="card border-green-200 bg-green-50">
            <p className="text-sm text-green-600">Returned</p>
            <p className="text-2xl font-bold text-green-700">{summary.returned}</p>
          </div>
          <div className="card border-red-200 bg-red-50">
            <p className="text-sm text-red-600">Overdue Returns</p>
            <p className="text-2xl font-bold text-red-700">{summary.overdue}</p>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card">
          {siteInventory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Inventory Deployed
              </h3>
              <p className="text-gray-600">
                No items have been deployed to this site yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Item Name</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Quantity</th>
                    <th className="table-header">Deployed Date</th>
                    <th className="table-header">Expected Return</th>
                    <th className="table-header">Actual Return</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {siteInventory.map((inv) => {
                    const isOverdue =
                      !inv.actualReturnDate &&
                      inv.expectedReturnDate &&
                      new Date(inv.expectedReturnDate) < new Date();

                    return (
                      <tr key={inv.id} className={isOverdue ? "bg-red-50" : ""}>
                        <td className="table-cell">
                          <Link
                            href={`/dashboard/inventory/${inv.item.id}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {inv.item.name}
                          </Link>
                        </td>
                        <td className="table-cell">
                          <div>
                            <p className="text-sm">{inv.item.category.name}</p>
                            {inv.item.subcategory && (
                              <p className="text-xs text-gray-500">
                                {inv.item.subcategory.name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="font-semibold text-lg">
                            {inv.quantityDeployed}
                          </span>
                        </td>
                        <td className="table-cell text-sm">
                          {new Date(inv.deployedDate).toLocaleDateString()}
                        </td>
                        <td className="table-cell text-sm">
                          {inv.expectedReturnDate
                            ? new Date(inv.expectedReturnDate).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="table-cell text-sm">
                          {inv.actualReturnDate ? (
                            <span className="text-green-600 font-medium">
                              {new Date(inv.actualReturnDate).toLocaleDateString()}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="table-cell">
                          {inv.actualReturnDate ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Returned
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                              Deployed
                            </span>
                          )}
                        </td>
                        <td className="table-cell text-xs text-gray-600 max-w-xs truncate">
                          {inv.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
