import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ParsedRow {
    sno: string;
    category: string;
    subcategory: string;
    itemName: string;
    description: string;
    quantity: string;
    location: string;
    vendor: string;
    hsnCode: string;
    photo: string;
}

function parseCSV(csvText: string): ParsedRow[] {
    const lines = csvText.split('\n').filter((line) => line.trim());
    const rows: ParsedRow[] = [];

    // Track last non-empty category for inheritance
    let lastCategory = '';

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;

        // Simple CSV parser
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim());

        if (parts.length >= 10) {
            // If category is empty, inherit from previous row
            const category = parts[1] || lastCategory;
            if (parts[1]) {
                lastCategory = parts[1];
            }

            rows.push({
                sno: parts[0] || '',
                category: category,
                subcategory: parts[2] || '',
                itemName: parts[3] || '',
                description: parts[4] || '',
                quantity: parts[5] || '',
                location: parts[6] || '',
                vendor: parts[7] || '',
                hsnCode: parts[8] || '',
                photo: parts[9] || '',
            });
        }
    }

    return rows;
}

function parseQuantity(qtyStr: string): number {
    if (!qtyStr || qtyStr.trim() === '') return 0;

    // Handle "6 Bdl", "48 Box", etc.
    const match = qtyStr.match(/^(\d+)/);
    if (match) {
        return parseInt(match[1], 10);
    }

    return 0;
}

async function main() {
    console.log('🚀 Starting real data import...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, 'inventory-data.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found at:', csvPath);
        console.log('Please ensure inventory-data.csv exists in the prisma folder');
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Step 1: Clear existing inventory data (keep users)
    console.log('📦 Clearing existing inventory data...');

    await prisma.scrapRecord.deleteMany();
    await prisma.repairQueue.deleteMany();
    await prisma.maintenanceRecord.deleteMany();
    await prisma.challanItem.deleteMany();
    await prisma.challan.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.bundleTemplateItem.deleteMany();
    await prisma.bundleTemplate.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.siteInventory.deleteMany();
    await prisma.labourAttendance.deleteMany();
    await prisma.item.deleteMany();
    await prisma.subcategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.project.deleteMany();
    await prisma.site.deleteMany();

    console.log('✅ Cleared existing data\n');

    // Step 2: Ensure users exist
    console.log('👥 Ensuring users exist...');

    const DEFAULT_PASSWORD = 'password123';

    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            passwordHash: await hash(DEFAULT_PASSWORD, 10),
            role: 'ADMIN',
        },
    });

    await prisma.user.upsert({
        where: { email: 'manager@example.com' },
        update: {},
        create: {
            email: 'manager@example.com',
            name: 'Inventory Manager',
            passwordHash: await hash(DEFAULT_PASSWORD, 10),
            role: 'INVENTORY_MANAGER',
        },
    });

    await prisma.user.upsert({
        where: { email: 'viewer@example.com' },
        update: {},
        create: {
            email: 'viewer@example.com',
            name: 'Viewer User',
            passwordHash: await hash(DEFAULT_PASSWORD, 10),
            role: 'VIEWER',
        },
    });

    console.log('✅ Users ready\n');

    // Step 3: Parse CSV data
    console.log('📄 Parsing CSV data...');
    const rows = parseCSV(csvContent);
    console.log(`✅ Parsed ${rows.length} rows\n`);

    // Step 4: Extract unique locations and create sites
    console.log('📍 Creating sites...');
    const locations = new Set<string>();
    rows.forEach((row) => {
        if (row.location) locations.add(row.location.trim());
    });

    const siteMap = new Map<string, string>();
    for (const location of locations) {
        if (!location) continue;

        const site = await prisma.site.create({
            data: {
                name: location,
                location: location,
                description: `Storage/deployment location: ${location}`,
                isActive: true,
            },
        });
        siteMap.set(location, site.id);
        console.log(`  ✓ Created site: ${location}`);
    }
    console.log(`✅ Created ${siteMap.size} sites\n`);

    // Step 5: Extract unique categories and subcategories
    console.log('📂 Creating categories and subcategories...');
    const categoryMap = new Map<string, string>();
    const subcategoryMap = new Map<string, string>();

    const uniqueCategories = new Set<string>();
    const uniqueSubcategories = new Map<string, Set<string>>();

    rows.forEach((row) => {
        if (row.category) {
            uniqueCategories.add(row.category.trim());
            if (row.subcategory) {
                if (!uniqueSubcategories.has(row.category.trim())) {
                    uniqueSubcategories.set(row.category.trim(), new Set());
                }
                uniqueSubcategories.get(row.category.trim())!.add(row.subcategory.trim());
            }
        }
    });

    // Create categories
    for (const catName of uniqueCategories) {
        const category = await prisma.category.create({
            data: {
                name: catName,
                description: `${catName} items`,
            },
        });
        categoryMap.set(catName, category.id);
        console.log(`  ✓ Created category: ${catName}`);

        // Create subcategories for this category
        const subcats = uniqueSubcategories.get(catName);
        if (subcats) {
            for (const subName of subcats) {
                const subcategory = await prisma.subcategory.create({
                    data: {
                        categoryId: category.id,
                        name: subName,
                        description: `${subName} under ${catName}`,
                    },
                });
                subcategoryMap.set(`${catName}|${subName}`, subcategory.id);
                console.log(`    ✓ Created subcategory: ${subName}`);
            }
        }
    }
    console.log(`✅ Created ${categoryMap.size} categories\n`);

    // Step 6: Create items
    console.log('📦 Creating items...');
    let itemCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
        // Skip rows without category (as per user's instruction, leave blank)
        if (!row.category || !row.category.trim()) {
            skippedCount++;
            continue;
        }

        const categoryId = categoryMap.get(row.category.trim());
        if (!categoryId) {
            console.log(`  ⚠  Warning: Category not found for row ${row.sno}: ${row.category}`);
            continue;
        }

        const subcategoryId = row.subcategory
            ? subcategoryMap.get(`${row.category.trim()}|${row.subcategory.trim()}`)
            : null;

        const quantity = parseQuantity(row.quantity);
        const itemNameFull =
            row.itemName && row.description
                ? `${row.itemName} - ${row.description}`
                : row.itemName || row.description || 'Unknown Item';

        // Build remarks with HSN code
        let remarks = '';
        if (row.hsnCode) {
            remarks = `HSN: ${row.hsnCode}`;
        }
        if (row.quantity && (row.quantity.includes('Bdl') || row.quantity.includes('Box'))) {
            remarks += (remarks ? ' | ' : '') + `Original: ${row.quantity}`;
        }

        try {
            await prisma.item.create({
                data: {
                    categoryId,
                    subcategoryId: subcategoryId || undefined,
                    name: itemNameFull.trim(),
                    description: row.description ? row.description.trim() : null,
                    quantityAvailable: quantity,
                    condition: 'GOOD',
                    currentLocation: row.location ? row.location.trim() : null,
                    vendor: row.vendor ? row.vendor.trim() : null,
                    remarks: remarks || null,
                    imageUrl1: row.photo ? row.photo.trim() : null,
                },
            });
            itemCount++;

            if (itemCount % 50 === 0) {
                console.log(`  ... ${itemCount} items created`);
            }
        } catch (error) {
            console.error(`  ⚠ Error creating item from row ${row.sno}:`, error);
        }
    }

    console.log(`✅ Created ${itemCount} items (skipped ${skippedCount} rows without category)\n`);

    // Step 7: Summary
    console.log('📊 Import Summary:');
    console.log('━'.repeat(50));
    console.log(`  Sites:         ${await prisma.site.count()}`);
    console.log(`  Categories:    ${await prisma.category.count()}`);
    console.log(`  Subcategories: ${await prisma.subcategory.count()}`);
    console.log(`  Items:         ${await prisma.item.count()}`);
    console.log(`  Users:         ${await prisma.user.count()}`);
    console.log('━'.repeat(50));

    console.log('\n✨ Real data import completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
}

main()
    .catch((e) => {
        console.error('❌ Error during import:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
