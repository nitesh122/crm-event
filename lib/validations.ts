import { z } from "zod";
import { ItemCondition, MovementType, ProjectType, ProjectStatus, RepairStatus, DisposalMethod, ShiftType, POStatus } from "@prisma/client";

// ============================================
// Common Schemas
// ============================================

export const idSchema = z.string().cuid();

// ============================================
// Inventory Item Schemas
// ============================================

export const createItemSchema = z.object({
    categoryId: z.string().cuid("Invalid category ID"),
    subcategoryId: z.string().cuid("Invalid subcategory ID").optional().nullable(),
    name: z.string().min(1, "Name is required").max(255, "Name too long"),
    description: z.string().max(1000, "Description too long").optional().nullable(),
    quantityAvailable: z.coerce.number().int().min(0, "Quantity must be non-negative").default(0),
    condition: z.nativeEnum(ItemCondition).default("GOOD"),
    cost: z.coerce.number().positive("Cost must be positive").optional().nullable(),
    vendor: z.string().max(255, "Vendor name too long").optional().nullable(),
    remarks: z.string().max(1000, "Remarks too long").optional().nullable(),
    imageUrl1: z.string().url("Invalid image URL").optional().nullable(),
    imageUrl2: z.string().url("Invalid image URL").optional().nullable(),
    imageUrl3: z.string().url("Invalid image URL").optional().nullable(),
    currentLocation: z.string().max(255, "Location too long").optional().nullable(),
});

export const updateItemSchema = createItemSchema.partial().extend({
    createMaintenance: z.boolean().optional(),
    maintenanceNotes: z.string().max(1000).optional().nullable(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// ============================================
// Stock Movement Schemas
// ============================================

export const createStockMovementSchema = z.object({
    itemId: z.string().cuid("Invalid item ID"),
    projectId: z.string().cuid("Invalid project ID").optional().nullable(),
    movementType: z.nativeEnum(MovementType),
    quantity: z.coerce.number().int().positive("Quantity must be positive"),
    conditionAfter: z.nativeEnum(ItemCondition).optional().nullable(),
    notes: z.string().max(1000, "Notes too long").optional().nullable(),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;

// ============================================
// Challan Schemas
// ============================================

export const challanItemSchema = z.object({
    itemId: z.string().cuid("Invalid item ID"),
    quantity: z.coerce.number().int().positive("Quantity must be positive"),
    notes: z.string().max(500, "Notes too long").optional().nullable(),
});

export const createChallanSchema = z.object({
    projectId: z.string().cuid("Invalid project ID"),
    items: z.array(challanItemSchema).min(1, "At least one item is required"),
    expectedReturnDate: z.string().datetime().optional().nullable(),
    remarks: z.string().max(1000, "Remarks too long").optional().nullable(),
    truckNumber: z.string().max(50, "Truck number too long").optional().nullable(),
    driverName: z.string().max(100, "Driver name too long").optional().nullable(),
    driverPhone: z.string().max(20, "Phone number too long").optional().nullable(),
    movementDirection: z.enum(["INWARD", "OUTWARD"]).optional().nullable(),
});

export type ChallanItemInput = z.infer<typeof challanItemSchema>;
export type CreateChallanInput = z.infer<typeof createChallanSchema>;

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name too long"),
    type: z.nativeEnum(ProjectType).default("OTHER"),
    location: z.string().min(1, "Location is required").max(500, "Location too long"),
    siteId: z.string().cuid("Invalid site ID").optional().nullable(),
    startDate: z.string().datetime("Invalid start date"),
    endDate: z.string().datetime("Invalid end date").optional().nullable(),
    status: z.nativeEnum(ProjectStatus).default("PLANNED"),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================
// Purchase Order Schemas
// ============================================

export const purchaseOrderItemSchema = z.object({
    itemId: z.string().cuid("Invalid item ID"),
    orderedQuantity: z.coerce.number().int().positive("Quantity must be positive"),
    unitCost: z.coerce.number().positive("Cost must be positive").optional().nullable(),
    notes: z.string().max(500, "Notes too long").optional().nullable(),
});

export const createPurchaseOrderSchema = z.object({
    poNumber: z.string().min(1, "PO number is required").max(50, "PO number too long"),
    vendor: z.string().min(1, "Vendor is required").max(255, "Vendor name too long"),
    orderDate: z.string().datetime("Invalid order date"),
    expectedDate: z.string().datetime("Invalid expected date").optional().nullable(),
    totalAmount: z.coerce.number().positive("Amount must be positive").optional().nullable(),
    pdfUrl: z.string().url("Invalid PDF URL").optional().nullable(),
    excelUrl: z.string().url("Invalid Excel URL").optional().nullable(),
    notes: z.string().max(1000, "Notes too long").optional().nullable(),
    items: z.array(purchaseOrderItemSchema).optional(),
});

export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

// ============================================
// Repair Schemas
// ============================================

export const createRepairSchema = z.object({
    itemId: z.string().cuid("Invalid item ID"),
    assignedToUserId: z.string().cuid("Invalid user ID").optional().nullable(),
    technicianName: z.string().max(100, "Technician name too long").optional().nullable(),
    vendorName: z.string().max(255, "Vendor name too long").optional().nullable(),
    repairCost: z.coerce.number().positive("Cost must be positive").optional().nullable(),
    estimatedDays: z.coerce.number().int().positive("Days must be positive").optional().nullable(),
    notes: z.string().max(1000, "Notes too long").optional().nullable(),
});

export type CreateRepairInput = z.infer<typeof createRepairSchema>;

// ============================================
// Scrap Schemas
// ============================================

export const createScrapSchema = z.object({
    itemId: z.string().cuid("Invalid item ID"),
    reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
    disposalMethod: z.nativeEnum(DisposalMethod),
    disposalDate: z.string().datetime("Invalid disposal date"),
    valueRealized: z.coerce.number().min(0, "Value must be non-negative").optional().nullable(),
    disposalNotes: z.string().max(1000, "Notes too long").optional().nullable(),
    approvedBy: z.string().max(100, "Approver name too long").optional().nullable(),
});

export type CreateScrapInput = z.infer<typeof createScrapSchema>;

// ============================================
// Labour Attendance Schemas
// ============================================

export const createLabourAttendanceSchema = z.object({
    labourName: z.string().min(1, "Labour name is required").max(100, "Name too long"),
    attendanceDate: z.string().datetime("Invalid date"),
    shiftType: z.nativeEnum(ShiftType),
    siteId: z.string().cuid("Invalid site ID").optional().nullable(),
    shiftsWorked: z.coerce.number().positive("Shifts must be positive").refine(
        (val) => val % 0.5 === 0,
        "Shifts must be in increments of 0.5"
    ),
    wagePerShift: z.coerce.number().positive("Wage must be positive").optional().nullable(),
    incentive: z.coerce.number().min(0, "Incentive must be non-negative").default(0),
    notes: z.string().max(500, "Notes too long").optional().nullable(),
});

export type CreateLabourAttendanceInput = z.infer<typeof createLabourAttendanceSchema>;

// ============================================
// Site Schemas
// ============================================

export const createSiteSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    location: z.string().min(1, "Location is required").max(500, "Location too long"),
    description: z.string().max(1000, "Description too long").optional().nullable(),
    isActive: z.boolean().default(true),
});

export const updateSiteSchema = createSiteSchema.partial();

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;

// ============================================
// Helper function for validation
// ============================================

export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return { success: false, error: errors };
}
