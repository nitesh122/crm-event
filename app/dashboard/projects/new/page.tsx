"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"

interface Site {
    id: string
    name: string
    location: string
}

export default function NewProjectPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [sites, setSites] = useState<Site[]>([])
    const [formData, setFormData] = useState({
        name: "",
        type: "CAMP",
        location: "",
        siteId: "",
        startDate: "",
        endDate: "",
        description: ""
    })

    useEffect(() => {
        // Fetch sites for dropdown
        fetch("/api/sites")
            .then((r) => r.json())
            .then((data) => setSites(Array.isArray(data) ? data : []))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    startDate: new Date(formData.startDate),
                    endDate: new Date(formData.endDate),
                    siteId: formData.siteId || null
                }),
            })

            if (response.ok) {
                router.push("/dashboard/projects")
                router.refresh()
            } else {
                const error = await response.json()
                alert(error.error || "Failed to create project")
            }
        } catch (error) {
            console.error("Error creating project:", error)
            alert("Failed to create project")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8">
            <Header
                title="Create New Project"
                subtitle="Add a new event, camp, or rental project"
            />

            <div className="mt-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="card space-y-6">
                    {/* Project Name */}
                    <div>
                        <label className="label">
                            Project Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Himalayan Adventure Camp 2025"
                        />
                    </div>

                    {/* Project Type */}
                    <div>
                        <label className="label">
                            Project Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            className="input"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="CAMP">Camp</option>
                            <option value="FESTIVAL">Festival</option>
                            <option value="CORPORATE_EVENT">Corporate Event</option>
                            <option value="RETREAT">Retreat</option>
                            <option value="RENTAL">Rental</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="label">
                            Location <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            className="input"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Manali, Himachal Pradesh"
                        />
                    </div>

                    {/* Site (Optional) */}
                    <div>
                        <label className="label">Site (Optional)</label>
                        <select
                            className="input"
                            value={formData.siteId}
                            onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                        >
                            <option value="">-- No Site --</option>
                            {sites.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.name} - {site.location}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Link this project to a specific site/venue
                        </p>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="label">
                            Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            className="input"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="label">
                            End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            className="input"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            min={formData.startDate}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="label">Description</label>
                        <textarea
                            className="input"
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Additional details about this project..."
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? "Creating..." : "Create Project"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
