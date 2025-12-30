# Inventory Data Format Specification
## For CRM Database Import

> [!IMPORTANT]
> **To ensure smooth import of inventory data into our CRM system, please provide the data in the exact format specified below.**

---

## 📋 Required File Format

Please provide the data as either:
- **Excel file (.xlsx)** - Preferred
- **CSV file (.csv)** - Alternative

---

## 📊 Required Column Structure

Your spreadsheet **MUST** contain the following columns in this exact order:

| Column # | Column Name | Data Type | Required | Description |
|----------|-------------|-----------|----------|-------------|
| 1 | **Category** | Text | ✅ Yes | Main product category (e.g., "Linen", "Furniture", "Camping Equipment") |
| 2 | **Subcategory** | Text | ❌ Optional | Sub-classification within category (e.g., "Bedding", "Seating") |
| 3 | **Item Name** | Text | ✅ Yes | Name of the item (e.g., "Duvet", "Chair", "Tent") |
| 4 | **Description** | Text | ❌ Optional | Additional details (e.g., "Single", "Double", "140\"-8", color, material) |
| 5 | **Quantity** | Number | ✅ Yes | Available stock quantity (must be a whole number, e.g., 100, 250) |
| 6 | **HSN Code** | Text/Number | ❌ Optional | HSN/SAC code for taxation (e.g., "63011000") |
| 7 | **Image 1** | Text (URL) | ❌ Optional | Image URL or file path for first product image |
| 8 | **Image 2** | Text (URL) | ❌ Optional | Image URL or file path for second product image |
| 9 | **Image 3** | Text (URL) | ❌ Optional | Image URL or file path for third product image |

> [!WARNING]
> **Do NOT include** columns for "Location" or "Vendor" - these will be managed separately in our system.

---

## ✅ Data Format Rules

### 1️⃣ **Category** (Required)
- Must be filled for every row
- Use consistent naming (e.g., always use "Linen", not "linen" or "LINEN" in different rows)
- Examples: `Linen`, `Furniture`, `Camping Equipment`, `Kitchen Items`

### 2️⃣ **Subcategory** (Optional)
- Can be left empty if not applicable
- If used, must relate to the Category
- Examples: `Bedding`, `Seating`, `Cooking Utensils`

### 3️⃣ **Item Name** (Required)
- Must be filled for every row
- Use clear, descriptive names
- Examples: `Duvet`, `Pillow`, `Chair`, `Table`, `Tent`

### 4️⃣ **Description** (Optional)
- Additional specifications or variants
- Keep concise but descriptive
- Examples: `Single`, `Double`, `Queen Size`, `Red Color`, `140"-8`, `Wooden`

### 5️⃣ **Quantity** (Required)
- **MUST be a whole number** (no decimals)
- Cannot be negative
- If out of stock, enter `0`
- Examples: `100`, `250`, `0`, `1500`

### 6️⃣ **HSN Code** (Optional)
- Standard HSN/SAC code for tax purposes
- Can be left empty if not available
- Examples: `63011000`, `94036000`, `63025200`

### 7️⃣ **Images** (Optional - Up to 3 images per item)
- Provide either:
  - **Public image URLs** (e.g., `https://example.com/images/item1.jpg`)
  - **File names** if sending images separately (e.g., `duvet_single_001.jpg`)
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`
- Maximum 3 images per item
- If no images available, leave these columns empty

---

## 📝 Data Entry Guidelines

### ✨ **IMPORTANT: Hierarchical Data Structure**

Based on your current data format, you may have rows where some fields are empty because they inherit from the row above. **Please convert this to a FLAT structure** where every row is complete.

#### ❌ **Current Format (NOT ACCEPTABLE):**
```
Category    | Subcategory | Item Name   | Description | Quantity | HSN Code
Linen       |             | Duvet       | Single      | 252      | 63011000
            |             |             | Double      | 22       | 63011000
            |             | Pillow      | Standard    | 244      |
```

#### ✅ **Required Format (ACCEPTABLE):**
```
Category    | Subcategory | Item Name   | Description | Quantity | HSN Code
Linen       | Bedding     | Duvet       | Single      | 252      | 63011000
Linen       | Bedding     | Duvet       | Double      | 22       | 63011000
Linen       | Bedding     | Pillow      | Standard    | 244      | 63025100
```

> [!CAUTION]
> **Every row must be complete with all required fields filled.** Do not leave cells empty expecting them to inherit values from above.

---

## 📄 Excel Template Structure

### **Column Headers (Row 1):**
```
Category | Subcategory | Item Name | Description | Quantity | HSN Code | Image 1 | Image 2 | Image 3
```

### **Sample Data (Rows 2+):**

| Category | Subcategory | Item Name | Description | Quantity | HSN Code | Image 1 | Image 2 | Image 3 |
|----------|-------------|-----------|-------------|----------|----------|---------|---------|---------|
| Linen | Bedding | Duvet | Single | 252 | 63011000 | https://example.com/duvet1.jpg | | |
| Linen | Bedding | Duvet | Double | 22 | 63011000 | https://example.com/duvet2.jpg | | |
| Linen | Bedding | Duvet Cover | Single | 330 | 63025200 | | | |
| Linen | Bedding | Duvet Cover | Double | 49 | 63025200 | | | |
| Linen | Bedding | Pillow | Standard | 244 | 63025100 | | | |
| Linen | Bedding | Pillow Cover | Standard | 204 | 63025100 | | | |
| Linen | Bedding | Cushion | Square | 68 | 63025300 | | | |
| Linen | Bedding | Cushion Cover | Square | 163 | 63025300 | | | |
| Furniture | Seating | Chair | Plastic White | 150 | 94017900 | chair_white.jpg | | |
| Furniture | Seating | Chair | Wooden | 75 | 94017100 | chair_wood_1.jpg | chair_wood_2.jpg | |
| Furniture | Tables | Dining Table | 6-Seater | 20 | 94036000 | | | |
| Kitchen | Utensils | Spoon | Steel | 500 | 82159100 | | | |

---

## 🎯 Data Validation Checklist

Before submitting the data, please verify:

- [ ] Every row has a **Category** filled
- [ ] Every row has an **Item Name** filled
- [ ] Every row has a **Quantity** (numeric value)
- [ ] No hierarchical/inherited cells (all rows are complete)
- [ ] Quantity values are whole numbers (no decimals)
- [ ] Category and Subcategory names are consistent throughout
- [ ] HSN Codes are valid (if provided)
- [ ] Image URLs are accessible (if provided)
- [ ] No "Location" or "Vendor" columns included

---

## 📤 Submission Instructions

1. **Fill the Excel/CSV file** with your inventory data following the exact format above
2. **If providing images:**
   - Option A: Include image URLs in the Image columns
   - Option B: Send image files separately in a ZIP folder with clear naming (e.g., `category_itemname_001.jpg`)
3. **Validate your data** using the checklist above
4. **Send the file** to us

---

## ❓ Examples for Different Scenarios

### Example 1: Item with Subcategory and Images
```
Category: Camping Equipment
Subcategory: Tents
Item Name: Dome Tent
Description: 4-Person Capacity, Waterproof
Quantity: 25
HSN Code: 63061200
Image 1: https://cdn.example.com/tent_dome_4p_front.jpg
Image 2: https://cdn.example.com/tent_dome_4p_interior.jpg
Image 3: (empty)
```

### Example 2: Item without Subcategory or Images
```
Category: Kitchen
Subcategory: (empty)
Item Name: Gas Cylinder
Description: 14kg
Quantity: 30
HSN Code: 27111900
Image 1: (empty)
Image 2: (empty)
Image 3: (empty)
```

### Example 3: Item with Multiple Variants
```
Category: Linen
Subcategory: Bedding
Item Name: Bed Sheet
Description: Single
Quantity: 313
HSN Code: 63025100
(Images empty)

Category: Linen
Subcategory: Bedding
Item Name: Bed Sheet
Description: Double
Quantity: 156
HSN Code: 63025100
(Images empty)
```

---

## 📞 Support

If you have any questions about this format or need clarification, please contact us before submitting the data.

---

**Last Updated:** December 22, 2024
