# Quick Reference Guide

## Common npm Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database (dev)
npm run db:migrate       # Create and run migrations (prod)
npm run db:seed          # Seed with demo data
npm run db:studio        # Open Prisma Studio GUI

# Code Quality
npm run lint             # Run ESLint
```

## Database Management

### View Database with Prisma Studio
```bash
npm run db:studio
```
Opens GUI at http://localhost:5555

### Reset Database
```bash
# Delete all data and recreate schema
npx prisma db push --force-reset
npm run db:seed
```

### Create Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Deploy Migration (Production)
```bash
npx prisma migrate deploy
```

## File Locations Reference

### Configuration
- `prisma/schema.prisma` - Database schema
- `lib/auth.ts` - NextAuth configuration
- `lib/permissions.ts` - Role permissions
- `.env` - Environment variables

### API Routes
- `app/api/inventory/items/` - Inventory CRUD
- `app/api/projects/` - Projects CRUD
- `app/api/stock-movements/` - Stock operations
- `app/api/challans/` - Challan generation
- `app/api/users/` - User management

### UI Pages
- `app/dashboard/` - Main dashboard
- `app/dashboard/inventory/` - Inventory pages
- `app/dashboard/projects/` - Project pages
- `app/dashboard/challans/` - Challan pages
- `app/dashboard/reports/` - Reports pages

### Components
- `components/Sidebar.tsx` - Navigation sidebar
- `components/Header.tsx` - Page header

## Common Tasks

### Add New Item to Inventory
1. Login as Admin or Manager
2. Go to Inventory
3. Click "Add Item"
4. Fill form and submit

### Create Stock Movement

**Inward (Add Stock):**
```bash
POST /api/stock-movements
{
  "itemId": "item-id",
  "movementType": "INWARD",
  "quantity": 10,
  "notes": "New purchase"
}
```

**Outward (Allocate to Project):**
```bash
POST /api/stock-movements
{
  "itemId": "item-id",
  "projectId": "project-id",
  "movementType": "OUTWARD",
  "quantity": 5,
  "notes": "Allocated for event"
}
```

**Return:**
```bash
POST /api/stock-movements
{
  "itemId": "item-id",
  "projectId": "project-id",
  "movementType": "RETURN",
  "quantity": 5,
  "conditionAfter": "GOOD",
  "notes": "Returned after event"
}
```

### Create Challan
1. Go to Challans
2. Click "Create Challan"
3. Select Project
4. Add Items (or use bundle template)
5. Set expected return date
6. Submit
7. Print using Print button

### Export Reports
- Stock Report: `/api/reports/export/stock?format=csv`
- Access via Reports page or direct link

### Add New User (Admin Only)
```bash
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure-password",
  "role": "INVENTORY_MANAGER"
}
```

## Role Permissions Quick Reference

| Feature | ADMIN | INVENTORY_MANAGER | VIEWER |
|---------|-------|-------------------|--------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Inventory | ✅ | ✅ | ✅ |
| Add/Edit Items | ✅ | ✅ | ❌ |
| Stock Movements | ✅ | ✅ | ❌ |
| Create Projects | ✅ | ✅ | ❌ |
| Create Challans | ✅ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ✅ |
| Export Data | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |

## Demo Accounts

After running `npm run db:seed`:

| Role | Email | Password | Use Case |
|------|-------|----------|----------|
| Admin | admin@example.com | admin123 | Full access, user management |
| Manager | manager@example.com | manager123 | Day-to-day operations |
| Viewer | viewer@example.com | viewer123 | Read-only, reports |

## Item Conditions

- **GOOD**: Normal working condition
- **REPAIR_NEEDED**: Needs minor repairs (auto-creates maintenance record)
- **DAMAGED**: Significantly damaged (auto-creates maintenance record)
- **REPLACED**: Item has been replaced

## Project Types

- **CAMP**: Camping events
- **FESTIVAL**: Music festivals, cultural events
- **CORPORATE_EVENT**: Corporate retreats, team building
- **RETREAT**: Spiritual retreats, workshops
- **RENTAL**: Equipment rental
- **OTHER**: Miscellaneous projects

## Project Status

- **PLANNED**: Not yet started
- **ACTIVE**: Currently ongoing
- **COMPLETED**: Finished, items returned

## Stock Movement Types

- **INWARD**: New stock arrival, purchases
- **OUTWARD**: Allocation to projects
- **RETURN**: Return from projects

## URLs Quick Access

```bash
# Local Development
http://localhost:3000                          # Landing/Login
http://localhost:3000/dashboard                # Dashboard
http://localhost:3000/dashboard/inventory      # Inventory
http://localhost:3000/dashboard/projects       # Projects
http://localhost:3000/dashboard/challans       # Challans
http://localhost:3000/dashboard/reports        # Reports
http://localhost:3000/dashboard/users          # User Management
```

## Troubleshooting Commands

### Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### Regenerate Prisma Client
```bash
npm run db:generate
```

### Check Database Connection
```bash
npx prisma db pull
```

### View Logs
Development logs appear in terminal where `npm run dev` is running

### Check Environment Variables
```bash
# Windows
echo %DATABASE_URL%

# Mac/Linux
echo $DATABASE_URL
```

## Production Checklist

Before deploying:

- [ ] Update DATABASE_URL with production DB
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Run `npm run build` successfully
- [ ] Test all features in production mode
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed initial data if needed
- [ ] Create admin user
- [ ] Test authentication
- [ ] Verify role-based access
- [ ] Test critical workflows
- [ ] Set up backup strategy

## Backup Strategy

### Manual Backup
```bash
pg_dump -U postgres inventory_crm > backup.sql
```

### Restore
```bash
psql -U postgres inventory_crm < backup.sql
```

## Support Resources

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org
- Tailwind Docs: https://tailwindcss.com/docs

## Custom Modifications

### Change Company Name in Challan
Edit: `app/dashboard/challans/[id]/print/page.tsx`

### Modify Color Scheme
Edit: `tailwind.config.ts`

### Add New Report
1. Create page in `app/dashboard/reports/`
2. Add API route in `app/api/reports/`
3. Add export endpoint if needed

### Create New Bundle Template
Use Prisma Studio or create via API:
```typescript
await prisma.bundleTemplate.create({
  data: {
    name: "Deluxe Setup",
    baseItemId: "tent-id",
    items: {
      create: [
        { itemId: "bed-id", quantityPerBaseUnit: 2 },
        { itemId: "light-id", quantityPerBaseUnit: 1 }
      ]
    }
  }
})
```

---

**For detailed explanations, see README.md**
