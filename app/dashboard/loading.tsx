import { StatsCardSkeleton, TableSkeleton } from "@/components/ui/ErrorBoundary";

export default function DashboardLoading() {
    return (
        <div className="p-6 space-y-6">
            {/* Header skeleton */}
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>

            {/* Table skeleton */}
            <div>
                <div className="h-6 bg-gray-200 rounded w-1/5 mb-4 animate-pulse" />
                <TableSkeleton rows={5} />
            </div>
        </div>
    );
}
