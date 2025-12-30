import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { canManageInventory } from "@/lib/permissions";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  const canManage = canManageInventory(session!.user.role);

  const items = await prisma.item.findMany({
    include: {
      category: true,
      subcategory: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Header
        title="Inventory"
        subtitle="Manage all items and stock levels"
        action={
          canManage ? (
            <Link href="/dashboard/inventory/new" className="btn btn-primary">
              + Add Item
            </Link>
          ) : undefined
        }
      />

      <div className="p-8">
        <InventoryClient
          items={items}
          categories={categories}
          canManage={canManage}
        />
      </div>
    </div>
  );
}
