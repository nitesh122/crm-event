"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface Project {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  category: { name: string };
  quantityAvailable: number;
}

interface BundleTemplate {
  id: string;
  name: string;
  items: {
    item: Item;
    quantityPerBaseUnit: number;
  }[];
}

interface ChallanItem {
  itemId: string;
  quantity: number;
  notes?: string;
}

export default function NewChallanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [challanItems, setChallanItems] = useState<ChallanItem[]>([]);
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [movementDirection, setMovementDirection] = useState("OUTWARD");

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/inventory/items").then((r) => r.json()),
    ]).then(([projectsData, itemsData]) => {
      setProjects(projectsData);
      // Items API returns paginated response with { data: [], pagination: {} }
      setItems(Array.isArray(itemsData) ? itemsData : itemsData.data || []);
    });
  }, []);

  const addItem = () => {
    setChallanItems([...challanItems, { itemId: "", quantity: 0, notes: "" }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...challanItems];
    updated[index] = { ...updated[index], [field]: value };
    setChallanItems(updated);
  };

  const removeItem = (index: number) => {
    setChallanItems(challanItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      alert("Please select a project");
      return;
    }

    if (challanItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/challans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          items: challanItems.filter((item) => item.itemId && item.quantity > 0),
          expectedReturnDate: expectedReturnDate || null,
          remarks,
          truckNumber: truckNumber || null,
          driverName: driverName || null,
          driverPhone: driverPhone || null,
          movementDirection: movementDirection || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/challans/${data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create challan");
      }
    } catch (error) {
      console.error("Error creating challan:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Create Challan" subtitle="Generate a new dispatch note" />

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="card space-y-6">
            {/* Project Selection */}
            <div>
              <label className="label">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="input"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="label mb-0">
                  Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn btn-secondary text-sm"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3">
                {challanItems.map((challanItem, index) => {
                  const selectedItem = items.find(
                    (item) => item.id === challanItem.itemId
                  );

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-4"
                    >
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-5">
                          <label className="text-xs text-gray-600">Item</label>
                          <select
                            className="input mt-1"
                            value={challanItem.itemId}
                            onChange={(e) =>
                              updateItem(index, "itemId", e.target.value)
                            }
                          >
                            <option value="">Select Item</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} (Available: {item.quantityAvailable})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-xs text-gray-600">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={selectedItem?.quantityAvailable || 999}
                            className="input mt-1"
                            value={challanItem.quantity}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="col-span-4">
                          <label className="text-xs text-gray-600">Notes</label>
                          <input
                            type="text"
                            className="input mt-1"
                            placeholder="Optional notes"
                            value={challanItem.notes}
                            onChange={(e) =>
                              updateItem(index, "notes", e.target.value)
                            }
                          />
                        </div>

                        <div className="col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="btn btn-danger text-sm w-full"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Truck and Driver Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3">
                🚚 Truck & Driver Information (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-blue-800">Truck Number</label>
                  <input
                    type="text"
                    className="input mt-1"
                    value={truckNumber}
                    onChange={(e) => setTruckNumber(e.target.value)}
                    placeholder="e.g., MH-01-AB-1234"
                  />
                </div>
                <div>
                  <label className="text-xs text-blue-800">
                    Movement Direction
                  </label>
                  <select
                    className="input mt-1"
                    value={movementDirection}
                    onChange={(e) => setMovementDirection(e.target.value)}
                  >
                    <option value="OUTWARD">Outward (To Site)</option>
                    <option value="INWARD">Inward (From Site)</option>
                    <option value="TRANSFER">Transfer (Site to Site)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-blue-800">Driver Name</label>
                  <input
                    type="text"
                    className="input mt-1"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver's full name"
                  />
                </div>
                <div>
                  <label className="text-xs text-blue-800">Driver Phone</label>
                  <input
                    type="tel"
                    className="input mt-1"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
            </div>

            {/* Expected Return Date */}
            <div>
              <label className="label">Expected Return Date</label>
              <input
                type="date"
                className="input"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="label">Remarks</label>
              <textarea
                className="input"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any special instructions or notes"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Challan"}
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
