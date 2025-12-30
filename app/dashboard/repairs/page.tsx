"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface RepairItem {
  id: string;
  itemId: string;
  notes: string | null;
  priority: string;
  status: string;
  assignedTo: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  reportedDate: Date;
  startedDate: Date | null;
  completedDate: Date | null;
  item: {
    name: string;
    category: { name: string };
  };
}

interface RepairSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  highPriority: number;
  totalCost: number;
}

export default function RepairsPage() {
  const [loading, setLoading] = useState(true);
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [summary, setSummary] = useState<RepairSummary>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    highPriority: 0,
    totalCost: 0,
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  useEffect(() => {
    fetchRepairs();
  }, [statusFilter, priorityFilter]);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);

      const response = await fetch(`/api/repairs?${params.toString()}`);
      const data = await response.json();
      setRepairs(data.repairs);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching repairs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-orange-100 text-orange-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <Header
        title="Repair Queue"
        subtitle="Manage item repairs and maintenance"
        action={
          <Link href="/dashboard/repairs/new" className="btn btn-primary">
            + New Repair Request
          </Link>
        }
      />

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600">Total Repairs</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="card border-yellow-200 bg-yellow-50">
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">
              {summary.pending}
            </p>
          </div>
          <div className="card border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-700">
              {summary.inProgress}
            </p>
          </div>
          <div className="card border-green-200 bg-green-50">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-2xl font-bold text-green-700">
              {summary.completed}
            </p>
          </div>
          <div className="card border-red-200 bg-red-50">
            <p className="text-sm text-red-600">High Priority</p>
            <p className="text-2xl font-bold text-red-700">
              {summary.highPriority}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Cost</p>
            <p className="text-xl font-bold">
              ₹{summary.totalCost.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status Filter
              </label>
              <div className="flex gap-2">
                {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === status
                          ? "bg-primary-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {status.replace("_", " ")}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Priority Filter
              </label>
              <div className="flex gap-2">
                {["ALL", "HIGH", "MEDIUM", "LOW"].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setPriorityFilter(priority)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${priorityFilter === priority
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Repairs Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading repairs...</p>
            </div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Repair Requests
              </h3>
              <p className="text-gray-600 mb-4">
                {statusFilter !== "ALL" || priorityFilter !== "ALL"
                  ? "No repairs match your filters."
                  : "No items are currently in the repair queue."}
              </p>
              <Link href="/dashboard/repairs/new" className="btn btn-primary">
                Create Repair Request
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Item</th>
                    <th className="table-header">Issue</th>
                    <th className="table-header">Priority</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Assigned To</th>
                    <th className="table-header">Reported</th>
                    <th className="table-header">Estimated Cost</th>
                    <th className="table-header">Actual Cost</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {repairs.map((repair) => (
                    <tr key={repair.id}>
                      <td className="table-cell">
                        <Link
                          href={`/dashboard/inventory/${repair.itemId}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {repair.item.name}
                        </Link>
                        <p className="text-xs text-gray-600">
                          {repair.item.category.name}
                        </p>
                      </td>
                      <td className="table-cell max-w-xs">
                        <p className="text-sm truncate">
                          {repair.notes || 'No notes'}
                        </p>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(
                            repair.priority
                          )}`}
                        >
                          {repair.priority}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(
                            repair.status
                          )}`}
                        >
                          {repair.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="table-cell text-sm">
                        {repair.assignedTo || "—"}
                      </td>
                      <td className="table-cell text-sm">
                        {new Date(repair.reportedDate).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-sm">
                        {repair.estimatedCost
                          ? `₹${parseFloat(repair.estimatedCost).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="table-cell text-sm font-medium">
                        {repair.actualCost
                          ? `₹${parseFloat(repair.actualCost).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/repairs/${repair.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View
                          </Link>
                          {repair.status !== "COMPLETED" &&
                            repair.status !== "CANCELLED" && (
                              <Link
                                href={`/dashboard/repairs/${repair.id}/update`}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Update
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
