# Quick Reference: Data Submission Format
## One-Page Summary for Client

---

## 📋 Exact Column Structure

```
Column 1: Category          (Required)
Column 2: Subcategory       (Optional)
Column 3: Item Name         (Required)
Column 4: Description       (Optional)
Column 5: Quantity          (Required - Must be a number)
Column 6: HSN Code          (Optional)
Column 7: Image 1           (Optional - URL or filename)
Column 8: Image 2           (Optional - URL or filename)
Column 9: Image 3           (Optional - URL or filename)
```

---

## ⚠️ Critical Rules

1. **Every row MUST be complete** - No empty cells expecting values to be inherited from above
2. **Remove these columns:** s.no, Location, Vendor
3. **File format:** Excel (.xlsx) or CSV (.csv)
4. **Quantities:** Whole numbers only (100, 250, etc.) - no decimals
5. **Maximum 3 images** per item

---

## ✅ Example of Correct Format

```
Category | Subcategory | Item Name | Description | Quantity | HSN Code | Image 1 | Image 2 | Image 3
---------|-------------|-----------|-------------|----------|----------|---------|---------|--------
Linen    | Bedding     | Duvet     | Single      | 252      | 63011000 |         |         |
Linen    | Bedding     | Duvet     | Double      | 22       | 63011000 |         |         |
Furniture| Seating     | Chair     | White       | 150      | 94017900 | url.jpg |         |
```

---

## ❌ Example of Incorrect Format (Do Not Submit Like This)

```
Category | Subcategory | Item Name | Description | Quantity | HSN Code
---------|-------------|-----------|-------------|----------|----------
Linen    |             | Duvet     | Single      | 252      | 63011000
         |             |           | Double      | 22       |          ← WRONG! Empty cells
Kitchen  |             |           |             | 100      |          ← WRONG! Missing item name
```

---

## 🎯 Before Submitting - Check These

- [ ] File is .xlsx or .csv format
- [ ] Columns match the exact structure above (9 columns total)
- [ ] Every row has Category, Item Name, and Quantity filled
- [ ] All quantities are whole numbers
- [ ] No Location or Vendor columns
- [ ] No empty cells in required columns
- [ ] Category names are consistent (same spelling/capitalization)

---

## 📤 What to Send

1. **Excel/CSV file** with inventory data
2. **Image files** (if not using URLs) - in a ZIP folder with clear names

---

## 📞 Questions?

Contact us BEFORE submitting if anything is unclear!
