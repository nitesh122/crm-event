"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface Site {
  id: string;
  name: string;
  location: string;
}

export default function NewAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [formData, setFormData] = useState({
    labourName: "",
    attendanceDate: new Date().toISOString().split("T")[0],
    shiftType: "WAREHOUSE",
    siteId: "",
    shiftsWorked: "1",
    wagePerShift: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then((data) => setSites(data));
  }, []);

  const calculateTotalWage = () => {
    if (formData.shiftsWorked && formData.wagePerShift) {
      return (
        parseFloat(formData.shiftsWorked) * parseFloat(formData.wagePerShift)
      ).toFixed(2);
    }
    return "0.00";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/labour-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attendanceDate: new Date(formData.attendanceDate).toISOString(),
        }),
      });

      if (response.ok) {
        alert("Attendance marked successfully");
        router.push("/dashboard/labour");
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to mark attendance");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header
        title="Mark Attendance"
        subtitle="Record labour attendance for warehouse or site"
      />

      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="card space-y-6">
            {/* Labour Name */}
            <div>
              <label className="label">
                Labour Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.labourName}
                onChange={(e) =>
                  setFormData({ ...formData, labourName: e.target.value })
                }
                placeholder="Enter labourer's name"
              />
            </div>

            {/* Date */}
            <div>
              <label className="label">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="input"
                value={formData.attendanceDate}
                onChange={(e) =>
                  setFormData({ ...formData, attendanceDate: e.target.value })
                }
              />
            </div>

            {/* Location Type */}
            <div>
              <label className="label">
                Location Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locationType"
                    value="WAREHOUSE"
                    checked={formData.shiftType === "WAREHOUSE"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shiftType: e.target.value,
                        siteId: "",
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${formData.shiftType === "WAREHOUSE"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    Warehouse
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locationType"
                    value="SITE"
                    checked={formData.shiftType === "SITE"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shiftType: e.target.value,
                      })
                    }
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${formData.shiftType === "SITE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    Site
                  </span>
                </label>
              </div>
            </div>

            {/* Site Selection (only for SITE type) */}
            {formData.shiftType === "SITE" && (
              <div>
                <label className="label">
                  Site <span className="text-red-500">*</span>
                </label>
                <select
                  required={formData.shiftType === "SITE"}
                  className="input"
                  value={formData.siteId}
                  onChange={(e) =>
                    setFormData({ ...formData, siteId: e.target.value })
                  }
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} - {site.location}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Shifts Worked */}
            <div>
              <label className="label">
                Shifts Worked <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input"
                value={formData.shiftsWorked}
                onChange={(e) =>
                  setFormData({ ...formData, shiftsWorked: e.target.value })
                }
              >
                <option value="0.5">0.5 (Half shift)</option>
                <option value="1">1 (Full shift)</option>
                <option value="1.5">1.5 (One and half shifts)</option>
                <option value="2">2 (Two shifts)</option>
                <option value="2.5">2.5 (Two and half shifts)</option>
                <option value="3">3 (Three shifts)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Shifts can be marked in increments of 0.5
              </p>
            </div>

            {/* Wage Per Shift */}
            <div>
              <label className="label">Wage Per Shift</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.wagePerShift}
                onChange={(e) =>
                  setFormData({ ...formData, wagePerShift: e.target.value })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Amount paid per shift
              </p>
            </div>

            {/* Total Wage Display */}
            {formData.wagePerShift && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-900">
                    Total Wage Calculation:
                  </span>
                  <span className="text-2xl font-bold text-green-700">
                    ₹{calculateTotalWage()}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {formData.shiftsWorked} shifts × ₹{formData.wagePerShift}
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional notes about this attendance..."
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <div className="text-xl">ℹ️</div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Attendance Recording
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>
                      • Shifts can be marked in 0.5 increments (0.5, 1, 1.5,
                      2...)
                    </li>
                    <li>
                      • Total wage is automatically calculated if wage per shift
                      is provided
                    </li>
                    <li>
                      • Warehouse attendance doesn't require site selection
                    </li>
                    <li>• Site attendance must have a site selected</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50"
              >
                {loading ? "Saving..." : "Mark Attendance"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
