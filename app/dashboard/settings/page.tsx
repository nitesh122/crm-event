import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { canManageUsers } from "@/lib/permissions";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !canManageUsers(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div>
      <Header title="Settings" subtitle="System configuration and preferences" />

      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* System Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">System Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Application Name</span>
                <span>Inventory Management CRM</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Environment</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {process.env.NODE_ENV}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Database</span>
                <span>PostgreSQL with Prisma ORM</span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Current User</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Name</span>
                <span>{session.user.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Email</span>
                <span>{session.user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Role</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  {session.user.role.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Company Settings */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  className="input"
                  defaultValue="YOUR COMPANY NAME"
                  disabled
                />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea
                  className="input"
                  rows={3}
                  defaultValue="Address Line 1, City, State - PIN"
                  disabled
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    className="input"
                    defaultValue="+91-XXXXXXXXXX"
                    disabled
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    defaultValue="info@company.com"
                    disabled
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
                <strong>Note:</strong> To update company information, edit the
                challan print template at:{" "}
                <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                  app/dashboard/challans/[id]/print/page.tsx
                </code>
              </div>
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Inventory Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Low Stock Threshold</label>
                <input
                  type="number"
                  className="input"
                  defaultValue="10"
                  disabled
                />
                <p className="text-xs text-gray-600 mt-1">
                  Items below this quantity will show as low stock
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
                <strong>Note:</strong> To modify settings functionality, add
                database models and API endpoints. Currently showing static values
                for reference.
              </div>
            </div>
          </div>

          {/* System Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">System Actions</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-medium">Database Backup</p>
                  <p className="text-xs text-gray-600">
                    Export database for backup purposes
                  </p>
                </div>
                <button className="btn btn-secondary text-sm" disabled>
                  Coming Soon
                </button>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <div>
                  <p className="font-medium">Clear Cache</p>
                  <p className="text-xs text-gray-600">
                    Clear application cache and temporary data
                  </p>
                </div>
                <button className="btn btn-secondary text-sm" disabled>
                  Coming Soon
                </button>
              </div>
              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="font-medium">Audit Logs</p>
                  <p className="text-xs text-gray-600">
                    View complete system activity logs
                  </p>
                </div>
                <a
                  href="/dashboard/stock-movements"
                  className="btn btn-secondary text-sm"
                >
                  View Logs
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/dashboard/users"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium">User Management</p>
                <p className="text-xs text-gray-600 mt-1">
                  Manage system users and roles
                </p>
              </a>
              <a
                href="/dashboard/reports"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium">Reports</p>
                <p className="text-xs text-gray-600 mt-1">
                  View analytics and exports
                </p>
              </a>
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium">Documentation</p>
                <p className="text-xs text-gray-600 mt-1">
                  View help and documentation
                </p>
              </a>
              <a
                href="/api/reports/export/stock?format=csv"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium">Export Data</p>
                <p className="text-xs text-gray-600 mt-1">
                  Export inventory to CSV
                </p>
              </a>
            </div>
          </div>

          {/* Technical Info */}
          <div className="card bg-gray-50">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">
              Technical Stack
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-medium text-gray-600">Frontend</p>
                <p className="text-gray-800">Next.js 14 + TypeScript</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Backend</p>
                <p className="text-gray-800">Next.js API Routes</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Database</p>
                <p className="text-gray-800">PostgreSQL + Prisma</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Authentication</p>
                <p className="text-gray-800">NextAuth.js</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Styling</p>
                <p className="text-gray-800">Tailwind CSS</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Deployment</p>
                <p className="text-gray-800">Vercel Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
