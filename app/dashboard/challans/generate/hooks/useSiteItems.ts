import { useState, useEffect } from "react";
import { SiteItem, KitGroup } from "../types";

export function useSiteItems(siteId: string | null) {
    const [items, setItems] = useState<SiteItem[]>([]);
    const [kitGroups, setKitGroups] = useState<KitGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!siteId) {
            setLoading(false);
            return;
        }

        const fetchItems = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/sites/${siteId}/deployed-items`);

                if (!response.ok) {
                    throw new Error("Failed to fetch site items");
                }

                const data = await response.json();
                setItems(data.items || []);
                setKitGroups(data.kitGroups || []);
                setError(null);
            } catch (err) {
                console.error("Error fetching site items:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
                setItems([]);
                setKitGroups([]);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [siteId]);

    return { items, kitGroups, loading, error };
}
