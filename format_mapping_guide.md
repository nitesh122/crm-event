# Format Mapping Guide
## Transforming Current Data to Required Format

This document shows how to convert the current hierarchical spreadsheet format to the flat format required for database import.

---

## 🔄 Transformation Overview

### Current Structure (Client's Google Sheets)
```
Column 1: s.no
Column 2: Item Category
Column 3: Item Name  
Column 4: Description
Column 5: Quantity
Column 6: Location (❌ SKIP THIS)
Column 7: Vendor (❌ SKIP THIS)
Column 8: HSN Code
Column 9: Photo
```

### Required Structure (For CRM Import)
```
Column 1: Category
Column 2: Subcategory
Column 3: Item Name
Column 4: Description
Column 5: Quantity
Column 6: HSN Code
Column 7: Image 1
Column 8: Image 2
Column 9: Image 3
```

---

## 📊 Field Mapping

| Current Field | Action | New Field | Notes |
|--------------|--------|-----------|-------|
| s.no | ❌ **Remove** | - | Serial numbers not needed |
| Item Category | ✅ **Keep** | Category | Use as-is |
| Item Name | ✅ **Keep** | Item Name | Use as-is |
| Description | ✅ **Keep** | Description | Use as-is |
| Quantity | ✅ **Keep** | Quantity | Use as-is |
| Location | ❌ **Remove** | - | Will be managed in CRM |
| Vendor | ❌ **Remove** | - | Will be managed in CRM |
| HSN Code | ✅ **Keep** | HSN Code | Use as-is |
| Photo | ✅ **Keep** | Image 1, Image 2, Image 3 | Split into 3 columns |

**New Field:** `Subcategory` - This should be added to provide better categorization

---

## 🔍 Before & After Examples

### Example 1: Hierarchical → Flat Conversion

#### ❌ BEFORE (Current Format - Hierarchical)
```
s.no | Item Category | Item Name   | Description   | Quantity | Location | Vendor | HSN Code | Photo
1    | Linen        | duvet       | single        | 252      | jaipur   |        | 63011000 |
     |              |             | double        | 22       | jaipur   |        | 63011000 |
     |              | duvet cover | single        | 330      | jaipur   |        | 63025200 |
     |              |             | double        | 49       | jaipur   |        |          |
```

#### ✅ AFTER (Required Format - Flat)
```
Category | Subcategory | Item Name   | Description | Quantity | HSN Code | Image 1 | Image 2 | Image 3
Linen    | Bedding     | Duvet       | Single      | 252      | 63011000 |         |         |
Linen    | Bedding     | Duvet       | Double      | 22       | 63011000 |         |         |
Linen    | Bedding     | Duvet Cover | Single      | 330      | 63025200 |         |         |
Linen    | Bedding     | Duvet Cover | Double      | 49       | 63025200 |         |         |
```

---

### Example 2: Complete Item with Images

#### ❌ BEFORE
```
s.no | Item Category | Item Name | Description    | Quantity | Location | Vendor | HSN Code | Photo
15   | Furniture    | Chair     | plastic white  | 150      | jaipur   | ABC    | 94017900 | chair.jpg
```

#### ✅ AFTER
```
Category  | Subcategory | Item Name | Description   | Quantity | HSN Code | Image 1           | Image 2 | Image 3
Furniture | Seating     | Chair     | Plastic White | 150      | 94017900 | chair_white_1.jpg |         |
```

---

### Example 3: Items with Multiple Photos

#### ❌ BEFORE
```
Photo column contains: "tent_1.jpg, tent_2.jpg, tent_3.jpg"
```

#### ✅ AFTER
```
Image 1: tent_1.jpg
Image 2: tent_2.jpg
Image 3: tent_3.jpg
```

---

## 📝 Step-by-Step Transformation Instructions

### Step 1: Add Subcategory Column
1. Insert a new column after "Category"
2. Name it "Subcategory"
3. Fill in logical subcategories for each item
   - Example: Linen → Bedding, Towels, Covers
   - Example: Furniture → Seating, Tables, Storage

### Step 2: Remove Unwanted Columns
1. Delete the "s.no" column
2. Delete the "Location" column
3. Delete the "Vendor" column

### Step 3: Split Photo Column
1. Replace single "Photo" column with three columns: "Image 1", "Image 2", "Image 3"
2. If an item has multiple photos, split them across the three columns
3. If fewer than 3 photos, leave remaining columns empty

### Step 4: Fill Empty Cells (Most Important!)
**This is the critical step to flatten the hierarchy:**

For every row:
1. If "Category" is empty, copy from the row above
2. If "Item Name" is empty, copy from the row above
3. If "HSN Code" is empty, either:
   - Copy from the row above if it's the same item
   - Leave blank if it's genuinely unknown
4. Ensure every row has values in **all required columns**

### Step 5: Standardize Text
1. Capitalize first letter of each word consistently
2. Remove extra spaces
3. Use consistent punctuation

### Step 6: Validate Data
- [ ] Every row has Category
- [ ] Every row has Item Name
- [ ] Every row has Quantity (number)
- [ ] No empty cells in required columns
- [ ] Quantities are whole numbers
- [ ] Location and Vendor columns removed

---

## 🎯 Category & Subcategory Suggestions

Based on the current data, here are recommended category structures:

### Linen
- **Subcategories:** Bedding, Towels, Table Linen

### Furniture  
- **Subcategories:** Seating, Tables, Storage

### Camping Equipment
- **Subcategories:** Tents, Sleeping Gear, Cooking

### Kitchen
- **Subcategories:** Utensils, Appliances, Cookware

### Electrical
- **Subcategories:** Lighting, Power Equipment, Cables

---

## ✅ Quality Checklist

Before submitting transformed data:

- [ ] All hierarchical structure removed (every row is independent)
- [ ] s.no column deleted
- [ ] Location column deleted  
- [ ] Vendor column deleted
- [ ] Subcategory column added and filled
- [ ] Photo column split into Image 1, Image 2, Image 3
- [ ] All required fields have values in every row
- [ ] Text is properly capitalized and consistent
- [ ] Quantities are numeric whole numbers
- [ ] File is in .xlsx or .csv format

---

## 📞 Need Help?

If you're unsure about any transformation step, please reach out before submitting the data.

**Remember:** It's better to ask questions than to submit incorrectly formatted data!
