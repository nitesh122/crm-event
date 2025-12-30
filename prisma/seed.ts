import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// ============================================
// Seed Configuration
// ============================================

// Get passwords from environment or use development defaults with warning
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DEFAULT_MANAGER_PASSWORD = 'manager123';
const DEFAULT_VIEWER_PASSWORD = 'viewer123';

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
const MANAGER_PASSWORD = process.env.SEED_MANAGER_PASSWORD || DEFAULT_MANAGER_PASSWORD;
const VIEWER_PASSWORD = process.env.SEED_VIEWER_PASSWORD || DEFAULT_VIEWER_PASSWORD;

// Security warning for default passwords
if (
  ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD ||
  MANAGER_PASSWORD === DEFAULT_MANAGER_PASSWORD ||
  VIEWER_PASSWORD === DEFAULT_VIEWER_PASSWORD
) {
  console.warn('⚠️  WARNING: Using default seed passwords!');
  console.warn('Set SEED_ADMIN_PASSWORD, SEED_MANAGER_PASSWORD, and SEED_VIEWER_PASSWORD');
  console.warn('environment variables for production use.\n');
}

async function main() {
  console.log('Starting seed...')

  // Create Users
  console.log('Creating users...')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: await hash(ADMIN_PASSWORD, 10),
      role: 'ADMIN',
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Inventory Manager',
      passwordHash: await hash(MANAGER_PASSWORD, 10),
      role: 'INVENTORY_MANAGER',
    },
  })

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      name: 'Viewer User',
      passwordHash: await hash(VIEWER_PASSWORD, 10),
      role: 'VIEWER',
    },
  })

  console.log('Users created:', { adminUser, managerUser, viewerUser })

  // Create Categories (using upsert for idempotency)
  console.log('Creating categories...')
  const tentCategory = await prisma.category.upsert({
    where: { name: 'Tents' },
    update: {},
    create: {
      name: 'Tents',
      description: 'All types of tents for events',
    },
  })

  const furnitureCategory = await prisma.category.upsert({
    where: { name: 'Furniture' },
    update: {},
    create: {
      name: 'Furniture',
      description: 'Beds, tables, chairs and other furniture',
    },
  })

  const lightingCategory = await prisma.category.upsert({
    where: { name: 'Lighting' },
    update: {},
    create: {
      name: 'Lighting',
      description: 'Lights and lighting equipment',
    },
  })

  const electronicCategory = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic equipment and appliances',
    },
  })

  // Create Subcategories (using upsert for idempotency)
  console.log('Creating subcategories...')
  const deluxeTentSub = await prisma.subcategory.upsert({
    where: {
      categoryId_name: {
        categoryId: tentCategory.id,
        name: 'Deluxe Tents',
      }
    },
    update: {},
    create: {
      categoryId: tentCategory.id,
      name: 'Deluxe Tents',
      description: 'Premium quality tents',
    },
  })

  const standardTentSub = await prisma.subcategory.upsert({
    where: {
      categoryId_name: {
        categoryId: tentCategory.id,
        name: 'Standard Tents',
      }
    },
    update: {},
    create: {
      categoryId: tentCategory.id,
      name: 'Standard Tents',
      description: 'Regular camping tents',
    },
  })

  const bedsSub = await prisma.subcategory.upsert({
    where: {
      categoryId_name: {
        categoryId: furnitureCategory.id,
        name: 'Beds',
      }
    },
    update: {},
    create: {
      categoryId: furnitureCategory.id,
      name: 'Beds',
      description: 'Various types of beds',
    },
  })

  const tablesSub = await prisma.subcategory.upsert({
    where: {
      categoryId_name: {
        categoryId: furnitureCategory.id,
        name: 'Tables',
      }
    },
    update: {},
    create: {
      categoryId: furnitureCategory.id,
      name: 'Tables',
      description: 'Tables and side tables',
    },
  })

  // Create Items
  console.log('Creating items...')
  const deluxeTent = await prisma.item.create({
    data: {
      categoryId: tentCategory.id,
      subcategoryId: deluxeTentSub.id,
      name: 'Deluxe Tent - 4 Person',
      description: 'Premium waterproof tent with double layer',
      quantityAvailable: 50,
      condition: 'GOOD',
      cost: 15000,
      vendor: 'TentCo India',
      remarks: 'New stock arrived in Jan 2025',
    },
  })

  const standardTent = await prisma.item.create({
    data: {
      categoryId: tentCategory.id,
      subcategoryId: standardTentSub.id,
      name: 'Standard Tent - 2 Person',
      description: 'Basic camping tent',
      quantityAvailable: 100,
      condition: 'GOOD',
      cost: 5000,
      vendor: 'CampGear Ltd',
    },
  })

  const bed = await prisma.item.create({
    data: {
      categoryId: furnitureCategory.id,
      subcategoryId: bedsSub.id,
      name: 'Folding Bed',
      description: 'Portable folding bed',
      quantityAvailable: 120,
      condition: 'GOOD',
      cost: 2000,
      vendor: 'FurniSupply',
    },
  })

  const sideTable = await prisma.item.create({
    data: {
      categoryId: furnitureCategory.id,
      subcategoryId: tablesSub.id,
      name: 'Side Table',
      description: 'Small wooden side table',
      quantityAvailable: 80,
      condition: 'GOOD',
      cost: 800,
      vendor: 'FurniSupply',
    },
  })

  const ledLight = await prisma.item.create({
    data: {
      categoryId: lightingCategory.id,
      name: 'LED Camp Light',
      description: 'Rechargeable LED light',
      quantityAvailable: 200,
      condition: 'GOOD',
      cost: 500,
      vendor: 'LightWorld',
    },
  })

  const heater = await prisma.item.create({
    data: {
      categoryId: electronicCategory.id,
      name: 'Room Heater',
      description: 'Electric room heater 2000W',
      quantityAvailable: 30,
      condition: 'GOOD',
      cost: 3000,
      vendor: 'ElectroMart',
    },
  })

  const damagedTent = await prisma.item.create({
    data: {
      categoryId: tentCategory.id,
      subcategoryId: standardTentSub.id,
      name: 'Standard Tent - Damaged Batch',
      description: 'Needs repair - torn fabric',
      quantityAvailable: 10,
      condition: 'REPAIR_NEEDED',
      cost: 5000,
      vendor: 'CampGear Ltd',
      remarks: 'Returned from Mountain Festival - needs stitching',
    },
  })

  // Create Bundle Template
  console.log('Creating bundle template...')
  const tentBundle = await prisma.bundleTemplate.create({
    data: {
      name: 'Standard Tent Setup',
      description: 'Complete setup for one deluxe tent including furniture and lighting',
      baseItemId: deluxeTent.id,
      items: {
        create: [
          {
            itemId: bed.id,
            quantityPerBaseUnit: 2, // 2 beds per tent
          },
          {
            itemId: sideTable.id,
            quantityPerBaseUnit: 1, // 1 side table per tent
          },
          {
            itemId: ledLight.id,
            quantityPerBaseUnit: 1, // 1 light per tent
          },
        ],
      },
    },
  })

  console.log('Bundle template created:', tentBundle)

  // Create Projects
  console.log('Creating projects...')
  const project1 = await prisma.project.create({
    data: {
      name: 'Himalayan Adventure Camp 2025',
      type: 'CAMP',
      location: 'Manali, Himachal Pradesh',
      startDate: new Date('2025-03-15'),
      endDate: new Date('2025-03-25'),
      status: 'PLANNED',
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Goa Music Festival',
      type: 'FESTIVAL',
      location: 'Goa Beach',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-03'),
      status: 'ACTIVE',
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'Corporate Retreat - TechCorp',
      type: 'CORPORATE_EVENT',
      location: 'Lonavala, Maharashtra',
      startDate: new Date('2024-12-15'),
      endDate: new Date('2024-12-20'),
      status: 'COMPLETED',
    },
  })

  // Create Stock Movements for Project 2 (Active)
  console.log('Creating stock movements...')

  // Outward movement: Allocate 20 deluxe tents to Goa Music Festival
  const movement1 = await prisma.stockMovement.create({
    data: {
      itemId: deluxeTent.id,
      projectId: project2.id,
      movementType: 'OUTWARD',
      quantity: 20,
      previousQuantity: 50,
      newQuantity: 30,
      performedByUserId: managerUser.id,
      notes: 'Allocated for VIP area',
    },
  })

  // Update item quantity
  await prisma.item.update({
    where: { id: deluxeTent.id },
    data: { quantityAvailable: 30 },
  })

  // Outward movement: Allocate beds
  const movement2 = await prisma.stockMovement.create({
    data: {
      itemId: bed.id,
      projectId: project2.id,
      movementType: 'OUTWARD',
      quantity: 40,
      previousQuantity: 120,
      newQuantity: 80,
      performedByUserId: managerUser.id,
    },
  })

  await prisma.item.update({
    where: { id: bed.id },
    data: { quantityAvailable: 80 },
  })

  // Inward movement: New stock arrival
  const movement3 = await prisma.stockMovement.create({
    data: {
      itemId: ledLight.id,
      movementType: 'INWARD',
      quantity: 50,
      previousQuantity: 200,
      newQuantity: 250,
      performedByUserId: adminUser.id,
      notes: 'New stock purchased from LightWorld',
    },
  })

  await prisma.item.update({
    where: { id: ledLight.id },
    data: { quantityAvailable: 250 },
  })

  // Create Maintenance Record for damaged tents
  console.log('Creating maintenance records...')
  await prisma.maintenanceRecord.create({
    data: {
      itemId: damagedTent.id,
      status: 'PENDING',
      notes: 'Torn fabric needs stitching. 10 tents affected.',
      assignedToUserId: managerUser.id,
    },
  })

  // Create a Challan for Project 2
  console.log('Creating challan...')
  const challan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2025-001',
      projectId: project2.id,
      createdByUserId: managerUser.id,
      issueDate: new Date('2025-01-25'),
      expectedReturnDate: new Date('2025-02-05'),
      remarks: 'All items for VIP camping area',
      items: {
        create: [
          {
            itemId: deluxeTent.id,
            quantity: 20,
            notes: 'Check waterproofing before dispatch',
          },
          {
            itemId: bed.id,
            quantity: 40,
          },
          {
            itemId: sideTable.id,
            quantity: 20,
          },
          {
            itemId: ledLight.id,
            quantity: 20,
          },
        ],
      },
    },
  })

  console.log('Challan created:', challan)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
