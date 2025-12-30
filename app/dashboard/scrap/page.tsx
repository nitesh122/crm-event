"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface ScrapRecord {
  id: string;
  itemId: string;
  reason: string;
  createdAt: Date;
  disposalDate: Date | null;
  disposalMethod: string | null;
  valueRealized: string | null;
  disposalNotes: string | null;
  item: {
    name: string;
    category: { name: string };
  };
}

interface ScrapSummary {
  total: number;
  pending: number;
  disposed: number;
  totalValueRealized: number;
}

export default function ScrapPage() {
  const [loading, setLoading] = useState(true);
  const [scrapRecords, setScrapRecords] = useState<ScrapRecord[]>([]);
  const [summary, setSummary] = useState<ScrapSummary>({
    total: 0,
    pending: 0,
    disposed: 0,
    totalValueRealized: 0,
  });
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchScrapRecords();
  }, [statusFilter]);

  const fetchScrapRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/scrap?${params.toString()}`);
      const data = await response.json();
      setScrapRecords(data.scrapRecords);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching scrap records:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header
        title="Scrap Management"
        subtitle="Track scrapped items and disposal"
        action={
          <Link href="/dashboard/scrap/new" className="btn btn-primary">
            + Mark Item as Scrap
          </Link>
        }
      />

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total Scrap Records</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="card border-orange-200 bg-orange-50">
            <p className="text-sm text-orange-600">Pending Disposal</p>
            <p className="text-2xl font-bold text-orange-700">
              {summary.pending}
            </p>
          </div>
          <div className="card border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">Disposed</p>
            <p className="text-2xl font-bold text-gray-700">
              {summary.disposed}
            </p>
          </div>
          <div className="card border-green-200 bg-green-50">
            <p className="text-sm text-green-600">Total Value Realized</p>
            <p className="text-xl font-bold text-green-700">
              ₹{summary.totalValueRealized.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700 my-auto mr-2">
              Status Filter:
            </label>
            {["ALL", "PENDING", "DISPOSED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === status
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Scrap Records Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading scrap records...</p>
            </div>
          ) : scrapRecords.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">♻️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Scrap Records
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter !== "ALL"
                  ? "No scrap records match your filter."
                  : "No items have been marked as scrap yet."}
              </p>
              <Link href="/dashboard/scrap/new" className="btn btn-primary">
                Mark Item as Scrap
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Item</th>
                    <th className="table-header">Reason</th>
                    <th className="table-header">Scrap Date</th>
                    <th className="table-header">Value Realized</th>
                    <th className="table-header">Disposal Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scrapRecords.map((scrap) => (
                    <tr
                      key={scrap.id}
                      className={scrap.disposalDate ? "bg-gray-50" : ""}
                    >
                      <td className="table-cell">
                        <Link
                          href={`/dashboard/inventory/${scrap.itemId}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {scrap.item.name}
                        </Link>
                        <p className="text-xs text-gray-600">
                          {scrap.item.category.name}
                        </p>
                      </td>
                      <td className="table-cell max-w-xs">
                        <p className="text-sm truncate">{scrap.reason}</p>
                      </td>
                      <td className="table-cell text-sm">
                        {new Date(scrap.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-sm font-medium">
                        {scrap.valueRealized ? (
                          <span className="text-green-600">
                            ₹{parseFloat(scrap.valueRealized).toFixed(2)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="table-cell">
                        {scrap.disposalDate ? (
                          <div>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">
                              Disposed
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(scrap.disposalDate).toLocaleDateString()}
                            </p>
                            {scrap.disposalMethod && (
                              <p className="text-xs text-gray-600">
                                via {scrap.disposalMethod}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/scrap/${scrap.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View
                          </Link>
                          {!scrap.disposalDate && (
                            <Link
                              href={`/dashboard/scrap/${scrap.id}/dispose`}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Dispose
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
