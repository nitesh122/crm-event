import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { canCreateChallans } from "@/lib/permissions";

export default async function ChallansPage() {
  const session = await getServerSession(authOptions);
  const canManage = canCreateChallans(session!.user.role);

  const challans = await prisma.challan.findMany({
    include: {
      project: true,
      createdBy: true,
      items: {
        include: {
          item: true,
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
        title="Challans"
        subtitle="Delivery and dispatch notes"
        action={
          canManage ? (
            <Link href="/dashboard/challans/new" className="btn btn-primary">
              + Create Challan
            </Link>
          ) : undefined
        }
      />

      <div className="p-8">
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Challan Number</th>
                  <th className="table-header">Project</th>
                  <th className="table-header">Issue Date</th>
                  <th className="table-header">Expected Return</th>
                  <th className="table-header">Items Count</th>
                  <th className="table-header">Created By</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {challans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No challans found. Create your first challan to get started.
                    </td>
                  </tr>
                ) : (
                  challans.map((challan) => (
                    <tr key={challan.id}>
                      <td className="table-cell font-mono font-semibold">
                        {challan.challanNumber}
                      </td>
                      <td className="table-cell">{challan.project.name}</td>
                      <td className="table-cell">
                        {new Date(challan.issueDate).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        {challan.expectedReturnDate
                          ? new Date(
                              challan.expectedReturnDate
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="table-cell">{challan.items.length}</td>
                      <td className="table-cell">{challan.createdBy.name}</td>
                      <td className="table-cell flex gap-2">
                        <Link
                          href={`/dashboard/challans/${challan.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/challans/${challan.id}/print`}
                          target="_blank"
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Print
                        </Link>
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
