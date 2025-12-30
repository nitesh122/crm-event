import { UserRole } from "@prisma/client"

export const canManageUsers = (role: UserRole) => role === "ADMIN"

export const canManageInventory = (role: UserRole) =>
  role === "ADMIN" || role === "INVENTORY_MANAGER"

export const canCreateStockMovements = (role: UserRole) =>
  role === "ADMIN" || role === "INVENTORY_MANAGER"

export const canCreateProjects = (role: UserRole) =>
  role === "ADMIN" || role === "INVENTORY_MANAGER"

export const canCreateChallans = (role: UserRole) =>
  role === "ADMIN" || role === "INVENTORY_MANAGER"

export const canViewReports = (role: UserRole) => true // All roles can view reports

export const canExportData = (role: UserRole) => true // All roles can export data
