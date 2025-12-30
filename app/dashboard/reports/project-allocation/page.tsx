import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function ProjectAllocationReportPage() {
  const projects = await prisma.project.findMany({
    include: {
      stockMovements: {
        include: {
          item: {
            include: {
              category: true,
            },
          },
        },
      },
      _count: {
        select: {
          stockMovements: true,
          challans: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  // Calculate allocation summary by project
  const projectAllocations = projects.map((project) => {
    const outwardMovements = project.stockMovements.filter(
      (m) => m.movementType === "OUTWARD"
    );
    const returnMovements = project.stockMovements.filter(
      (m) => m.movementType === "RETURN"
    );

    const totalAllocated = outwardMovements.reduce(
      (sum, m) => sum + m.quantity,
      0
    );
    const totalReturned = returnMovements.reduce((sum, m) => sum + m.quantity, 0);
    const currentlyAllocated = totalAllocated - totalReturned;

    return {
      project,
      totalAllocated,
      totalReturned,
      currentlyAllocated,
      uniqueItems: new Set(outwardMovements.map((m) => m.itemId)).size,
    };
  });

  const totalStats = {
    projects: projects.length,
    activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
    totalItemsAllocated: projectAllocations.reduce(
      (sum, p) => sum + p.currentlyAllocated,
      0
    ),
  };

  return (
    <div>
      <Header
        title="Project Allocation Report"
        subtitle="Items allocated to events and projects"
      />

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total Projects</p>
            <p className="text-2xl font-bold">{totalStats.projects}</p>
          </div>
          <div className="card border-green-200 bg-green-50">
            <p className="text-sm text-green-600">Active Projects</p>
            <p className="text-2xl font-bold text-green-700">
              {totalStats.activeProjects}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Items Currently Out</p>
            <p className="text-2xl font-bold">{totalStats.totalItemsAllocated}</p>
          </div>
        </div>

        {/* Project Allocations */}
        <div className="space-y-6">
          {projectAllocations.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Projects Found
              </h3>
              <p className="text-gray-600">
                Create projects and allocate items to see allocation reports.
              </p>
            </div>
          ) : (
            projectAllocations.map(
              ({
                project,
                totalAllocated,
                totalReturned,
                currentlyAllocated,
                uniqueItems,
              }) => (
                <div key={project.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {project.name}
                        </Link>
                      </h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📍 {project.location}</span>
                        <span>
                          📅{" "}
                          {new Date(project.startDate).toLocaleDateString()} -{" "}
                          {project.endDate
                            ? new Date(project.endDate).toLocaleDateString()
                            : "Ongoing"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            project.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : project.status === "COMPLETED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium">
                        {project.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  {/* Allocation Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Unique Items</p>
                      <p className="text-xl font-bold">{uniqueItems}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Allocated</p>
                      <p className="text-xl font-bold text-blue-600">
                        {totalAllocated}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Returned</p>
                      <p className="text-xl font-bold text-green-600">
                        {totalReturned}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Currently Out</p>
                      <p className="text-xl font-bold text-orange-600">
                        {currentlyAllocated}
                      </p>
                    </div>
                  </div>

                  {/* Items Detail */}
                  {project.stockMovements.filter(
                    (m) => m.movementType === "OUTWARD"
                  ).length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Item
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Category
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                              Allocated
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                              Returned
                            </th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                              Currently Out
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {project.stockMovements
                            .filter((m) => m.movementType === "OUTWARD")
                            .map((movement) => {
                              const returned = project.stockMovements
                                .filter(
                                  (m) =>
                                    m.movementType === "RETURN" &&
                                    m.itemId === movement.itemId
                                )
                                .reduce((sum, m) => sum + m.quantity, 0);

                              return (
                                <tr key={movement.id}>
                                  <td className="px-4 py-2">
                                    <Link
                                      href={`/dashboard/inventory/${movement.item.id}`}
                                      className="text-primary-600 hover:text-primary-700"
                                    >
                                      {movement.item.name}
                                    </Link>
                                  </td>
                                  <td className="px-4 py-2 text-gray-600">
                                    {movement.item.category.name}
                                  </td>
                                  <td className="px-4 py-2 text-right font-medium">
                                    {movement.quantity}
                                  </td>
                                  <td className="px-4 py-2 text-right text-green-600">
                                    {returned}
                                  </td>
                                  <td className="px-4 py-2 text-right text-orange-600 font-semibold">
                                    {movement.quantity - returned}
                                  </td>
                                  <td className="px-4 py-2 text-gray-600">
                                    {new Date(
                                      movement.createdAt
                                    ).toLocaleDateString()}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="btn btn-secondary text-sm"
                    >
                      View Project
                    </Link>
                    {project._count.challans > 0 && (
                      <Link
                        href={`/dashboard/challans?projectId=${project.id}`}
                        className="btn btn-secondary text-sm"
                      >
                        View Challans ({project._count.challans})
                      </Link>
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
