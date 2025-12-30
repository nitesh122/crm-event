import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { canManageUsers } from "@/lib/permissions";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !canManageUsers(session.user.role)) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          stockMovements: true,
          challansCreated: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <Header
        title="User Management"
        subtitle="Manage system users and permissions"
      />

      <div className="p-8">
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Stock Movements</th>
                  <th className="table-header">Challans Created</th>
                  <th className="table-header">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="table-cell font-medium">{user.name}</td>
                    <td className="table-cell">{user.email}</td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "INVENTORY_MANAGER"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="table-cell">
                      {user._count.stockMovements}
                    </td>
                    <td className="table-cell">
                      {user._count.challansCreated}
                    </td>
                    <td className="table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Roles Info */}
        <div className="card mt-6">
          <h3 className="font-semibold mb-3">Role Permissions</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong className="text-purple-700">ADMIN:</strong> Full access -
              manage users, inventory, projects, challans, and all reports
            </div>
            <div>
              <strong className="text-blue-700">INVENTORY_MANAGER:</strong>{" "}
              Manage inventory, stock movements, projects, and challans (cannot
              manage users)
            </div>
            <div>
              <strong className="text-gray-700">VIEWER:</strong> Read-only
              access - view dashboards, reports, and export data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
