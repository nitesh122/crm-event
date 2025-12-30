# Quick Setup Guide

Follow these steps to get your Inventory CRM up and running in minutes.

## Step 1: Install PostgreSQL

### Windows
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### Mac
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create Database

Open PostgreSQL terminal (psql) and run:

```sql
CREATE DATABASE inventory_crm;
```

Or use pgAdmin GUI tool to create a database named `inventory_crm`.

## Step 3: Configure Environment

1. The `.env` file is already created with default settings
2. Update the database connection string if needed:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/inventory_crm"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

## Step 4: Run Setup Commands

```bash
# Install dependencies (if not done)
npm install

# Generate Prisma client (already done)
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

## Step 5: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 6: Login with Demo Accounts

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **Viewer**: viewer@example.com / viewer123

## Common Issues

### "Database does not exist"
Create the database first using psql or pgAdmin.

### "Connection refused"
Ensure PostgreSQL service is running:
```bash
# Mac
brew services list

# Linux
sudo systemctl status postgresql

# Windows
Check Services app for PostgreSQL service
```

### "Prisma Client not found"
Run:
```bash
npm run db:generate
```

## Next Steps

1. Explore the dashboard and features
2. Create new items in Inventory
3. Set up a project
4. Generate your first challan
5. View reports and export data

## Production Deployment

See README.md for detailed production deployment instructions.

### Quick Checklist:
- [ ] Set up production PostgreSQL database
- [ ] Update `.env` with production DATABASE_URL
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Run `npm run build`
- [ ] Deploy to Vercel/Railway/Render
- [ ] Run migrations: `npx prisma migrate deploy`

That's it! You're ready to manage your tent and events inventory.
