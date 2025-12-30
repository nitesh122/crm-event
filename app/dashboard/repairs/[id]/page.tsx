import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

export default async function RepairDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const repair = await prisma.repairQueue.findUnique({
    where: { id: params.id },
    include: {
      item: {
        include: {
          category: true,
          subcategory: true,
        },
      },
    },
  });

  if (!repair) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_REPAIR":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SCRAPPED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const daysInRepair = repair.completedDate
    ? Math.ceil(
      (new Date(repair.completedDate).getTime() -
        new Date(repair.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    : Math.ceil(
      (new Date().getTime() - new Date(repair.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
    );

  return (
    <div>
      <Header
        title={`Repair: ${repair.item.name}`}
        subtitle={`Status: ${repair.status.replace("_", " ")}`}
        action={
          <div className="flex gap-2">
            {repair.status !== "COMPLETED" && repair.status !== "SCRAPPED" && (
              <>
                <Link
                  href={`/dashboard/repairs/${repair.id}/update`}
                  className="btn btn-primary"
                >
                  Update Status
                </Link>
                <Link
                  href={`/dashboard/repairs/${repair.id}/complete`}
                  className="btn bg-green-600 text-white hover:bg-green-700"
                >
                  Complete Repair
                </Link>
              </>
            )}
            <Link href="/dashboard/repairs" className="btn btn-secondary">
              ← Back to Repairs
            </Link>
          </div>
        }
      />

      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Status Banner */}
          <div
            className={`card ${repair.status === "COMPLETED"
                ? "border-green-200 bg-green-50"
                : repair.status === "IN_REPAIR"
                  ? "border-blue-200 bg-blue-50"
                  : repair.status === "SCRAPPED"
                    ? "border-gray-200 bg-gray-50"
                    : "border-yellow-200 bg-yellow-50"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">
                  {repair.status === "COMPLETED"
                    ? "✅"
                    : repair.status === "IN_REPAIR"
                      ? "🔧"
                      : repair.status === "SCRAPPED"
                        ? "❌"
                        : "⏳"}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">
                    {repair.status.replace("_", " ")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {repair.status === "COMPLETED"
                      ? `Completed in ${daysInRepair} days`
                      : `In repair queue for ${daysInRepair} days`}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                    repair.status
                  )}`}
                >
                  {repair.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Item Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Item Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Item Name
                </label>
                <p className="text-lg text-gray-900 mt-1">
                  <Link
                    href={`/dashboard/inventory/${repair.item.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {repair.item.name}
                  </Link>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Category
                </label>
                <p className="text-lg text-gray-900 mt-1">
                  {repair.item.category.name}
                  {repair.item.subcategory && (
                    <span className="text-sm text-gray-600 ml-2">
                      / {repair.item.subcategory.name}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Current Location
                </label>
                <p className="text-lg text-gray-900 mt-1">
                  {repair.status === "COMPLETED" || repair.status === "SCRAPPED"
                    ? repair.item.currentLocation || "Warehouse"
                    : "REPAIR_QUEUE"}
                </p>
              </div>
            </div>
          </div>

          {/* Repair Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Repair Information</h2>
            <div className="space-y-4">
              {repair.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Notes
                  </label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                    {repair.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline & Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Timeline</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Created
                    </p>
                    <p className="text-xs text-gray-600">Repair request created</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(repair.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {repair.startDate && (
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Started
                      </p>
                      <p className="text-xs text-blue-600">Work began</p>
                    </div>
                    <p className="text-sm font-semibold text-blue-900">
                      {new Date(repair.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {repair.completedDate && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Completed
                      </p>
                      <p className="text-xs text-green-600">Repair finished</p>
                    </div>
                    <p className="text-sm font-semibold text-green-900">
                      {new Date(repair.completedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Assignment & Cost</h2>
              <div className="space-y-4">
                {repair.technicianName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Technician
                    </label>
                    <p className="text-lg text-gray-900 mt-1">
                      {repair.technicianName}
                    </p>
                  </div>
                )}

                {repair.vendorName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Vendor
                    </label>
                    <p className="text-lg text-gray-900 mt-1">
                      {repair.vendorName}
                    </p>
                  </div>
                )}

                {repair.estimatedDays && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Estimated Days
                    </label>
                    <p className="text-lg text-gray-900 mt-1">
                      {repair.estimatedDays} days
                    </p>
                  </div>
                )}

                {repair.repairCost && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Repair Cost
                    </label>
                    <p className="text-lg font-semibold text-green-700 mt-1">
                      ₹{parseFloat(repair.repairCost.toString()).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
