import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

export default async function ScrapDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const scrapRecord = await prisma.scrapRecord.findUnique({
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

  if (!scrapRecord) {
    notFound();
  }

  const valueRealized = scrapRecord.valueRealized
    ? parseFloat(scrapRecord.valueRealized.toString())
    : 0;

  const daysInScrap = scrapRecord.disposalDate
    ? Math.ceil(
      (new Date(scrapRecord.disposalDate).getTime() -
        new Date(scrapRecord.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    : Math.ceil(
      (new Date().getTime() - new Date(scrapRecord.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
    );

  return (
    <div>
      <Header
        title={`Scrap: ${scrapRecord.item.name}`}
        subtitle={`Item scrapped on ${new Date(scrapRecord.createdAt).toLocaleDateString()}`}
        action={
          <div className="flex gap-2">
            {!scrapRecord.disposalDate && (
              <Link
                href={`/dashboard/scrap/${scrapRecord.id}/dispose`}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Mark as Disposed
              </Link>
            )}
            <Link href="/dashboard/scrap" className="btn btn-secondary">
              ← Back to Scrap
            </Link>
          </div>
        }
      />

      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Status Banner */}
          <div
            className={`card ${scrapRecord.disposalDate
                ? "border-gray-200 bg-gray-50"
                : "border-orange-200 bg-orange-50"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">
                  {scrapRecord.disposalDate ? "♻️" : "⚠️"}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">
                    {scrapRecord.disposalDate
                      ? "Disposed"
                      : "Pending Disposal"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {scrapRecord.disposalDate
                      ? `Disposed after ${daysInScrap} days`
                      : `Scrapped ${daysInScrap} days ago`}
                  </p>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${scrapRecord.disposalDate
                    ? "bg-gray-100 text-gray-800"
                    : "bg-orange-100 text-orange-800"
                  }`}
              >
                {scrapRecord.disposalDate ? "Disposed" : "Pending Disposal"}
              </span>
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
                    href={`/dashboard/inventory/${scrapRecord.item.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {scrapRecord.item.name}
                  </Link>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Category
                </label>
                <p className="text-lg text-gray-900 mt-1">
                  {scrapRecord.item.category.name}
                  {scrapRecord.item.subcategory && (
                    <span className="text-sm text-gray-600 ml-2">
                      / {scrapRecord.item.subcategory.name}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Scrap Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Scrap Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Reason for Scrapping
                </label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                  {scrapRecord.reason}
                </p>
              </div>

              {scrapRecord.disposalNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Notes
                  </label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                    {scrapRecord.disposalNotes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Scrap Date
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {new Date(scrapRecord.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {scrapRecord.disposalDate
                      ? `DISPOSED (${scrapRecord.disposalMethod})`
                      : "PENDING DISPOSAL"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Impact */}
          {valueRealized > 0 && (
            <div className="card border-green-200 bg-green-50">
              <h3 className="text-sm font-medium text-green-600 mb-2">
                Value Realized from Disposal
              </h3>
              <p className="text-2xl font-bold text-green-700">
                ₹{valueRealized.toFixed(2)}
              </p>
            </div>
          )}

          {/* Disposal Information */}
          {scrapRecord.disposalDate && (
            <div className="card border-gray-300">
              <h2 className="text-lg font-semibold mb-4">
                Disposal Information
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Disposal Date
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {new Date(scrapRecord.disposalDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Disposal Method
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {scrapRecord.disposalMethod || "—"}
                  </p>
                </div>
                {scrapRecord.approvedBy && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      Approved By
                    </label>
                    <p className="text-lg text-gray-900 mt-1">
                      {scrapRecord.approvedBy}
                    </p>
                  </div>
                )}
                {scrapRecord.disposalNotes && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      Disposal Notes
                    </label>
                    <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      {scrapRecord.disposalNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
