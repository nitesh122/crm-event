import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { canManageInventory } from "@/lib/permissions";

export default async function PurchaseOrdersPage() {
  const session = await getServerSession(authOptions);
  const canManage = canManageInventory(session!.user.role);

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      items: true,
      _count: {
        select: {
          items: true,
          stockMovements: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter((po) => po.status === "PENDING").length,
    partial: purchaseOrders.filter((po) => po.status === "PARTIALLY_RECEIVED")
      .length,
    completed: purchaseOrders.filter((po) => po.status === "FULLY_RECEIVED")
      .length,
  };

  return (
    <div>
      <Header
        title="Purchase Orders"
        subtitle="Manage purchase orders and deliveries"
        action={
          canManage ? (
            <Link
              href="/dashboard/purchase-orders/new"
              className="btn btn-primary"
            >
              + Create PO
            </Link>
          ) : undefined
        }
      />

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total POs</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="card border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-600">Pending</p>
            <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
          </div>
          <div className="card border-yellow-200 bg-yellow-50">
            <p className="text-sm text-yellow-600">Partial</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.partial}</p>
          </div>
          <div className="card border-green-200 bg-green-50">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-2xl font-bold text-green-700">
              {stats.completed}
            </p>
          </div>
        </div>

        {/* PO Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">PO Number</th>
                  <th className="table-header">Vendor</th>
                  <th className="table-header">Order Date</th>
                  <th className="table-header">Expected Date</th>
                  <th className="table-header">Items</th>
                  <th className="table-header">Total Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Created By</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      No purchase orders found. Create your first PO to get started.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td className="table-cell">
                        <Link
                          href={`/dashboard/purchase-orders/${po.id}`}
                          className="text-primary-600 hover:text-primary-700 font-mono font-semibold"
                        >
                          {po.poNumber}
                        </Link>
                      </td>
                      <td className="table-cell">{po.vendor}</td>
                      <td className="table-cell text-sm">
                        {new Date(po.orderDate).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-sm">
                        {po.expectedDate
                          ? new Date(po.expectedDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="table-cell">{po._count.items}</td>
                      <td className="table-cell">
                        {po.totalAmount
                          ? `₹${po.totalAmount.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            po.status === "PENDING"
                              ? "bg-blue-100 text-blue-800"
                              : po.status === "PARTIALLY_RECEIVED"
                              ? "bg-yellow-100 text-yellow-800"
                              : po.status === "FULLY_RECEIVED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {po.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="table-cell text-sm">
                        {po.createdBy.name}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/purchase-orders/${po.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View
                          </Link>
                          {po.status !== "FULLY_RECEIVED" && canManage && (
                            <Link
                              href={`/dashboard/purchase-orders/${po.id}/receive`}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Receive
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
