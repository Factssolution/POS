# 🧪 Thermal Receipt Testing Checklist

## Pre-Testing Setup ✅

- [ ] Backend server is running on port 5000
- [ ] Database has all receipt settings configured
- [ ] Company logo uploaded (optional but recommended)
- [ ] Frontend built successfully (`npm run build`)
- [ ] Browser cache cleared (Ctrl+Shift+Delete)

## Database Settings Verification ✅

Run this command to verify:
```powershell
$env:PGPASSWORD='postgres123'; & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d pos -c "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE '%receipt%' OR setting_key LIKE 'company_%' OR setting_key = 'tax_rate' ORDER BY setting_key;"
```

Expected output:
```
setting_key          | setting_value
---------------------|----------------------------------
company_address      | 123 Business Street, City, State
company_logo         | (URL or empty)
company_name         | Facts Solution Store
company_phone        | +91 9876543210
receipt_footer       | Thank you for your business!
receipt_static_footer| Powered by Facts Solution
tax_rate             | 18
```

## Functional Testing ✅

### 1. **Order Creation**
- [ ] Open POS system in browser
- [ ] Add at least 2 products to cart
- [ ] Enter customer name (optional)
- [ ] Select payment method
- [ ] Click "Checkout"
- [ ] Verify order created successfully
- [ ] Verify receipt modal opens automatically

### 2. **Receipt Data Display**
- [ ] Company logo displays (if configured)
- [ ] Company name shows correctly
- [ ] Company address displays
- [ ] Company phone number shows
- [ ] Token number is visible and correct
- [ ] Date and time are formatted properly
- [ ] Customer name displays (if entered)
- [ ] Cashier name shows

### 3. **Items Section**
- [ ] Items are numbered sequentially (1., 2., 3.)
- [ ] Product names are correct
- [ ] Quantity × Price breakdown shows
- [ ] Line totals are accurate
- [ ] All cart items appear in receipt

### 4. **Totals Section**
- [ ] Subtotal is correct
- [ ] Tax amount calculated correctly (18%)
- [ ] Tax percentage displays
- [ ] Grand total is bold and prominent
- [ ] Grand total = Subtotal + Tax
- [ ] Payment method shows correctly

### 5. **Dual Receipt Copies**
- [ ] "ORIGINAL" label appears at top
- [ ] "CUSTOMER COPY" label appears after divider
- [ ] Both receipts have identical formatting
- [ ] Dashed line separates the two copies

### 6. **Footer Section**
- [ ] Custom receipt message displays
- [ ] "Thank you for your business!" shows
- [ ] "Powered by Facts Solution" displays
- [ ] "All Rights Reserved 2025-2026" shows

## Print Testing ✅

### 1. **Print Preview**
- [ ] Click "Print Receipt" button
- [ ] Print dialog opens
- [ ] Receipt displays correctly in preview
- [ ] No extra pages in preview
- [ ] UI buttons are hidden in preview
- [ ] Only receipt content is visible

### 2. **Print Settings**
- [ ] Destination: Select thermal printer
- [ ] Pages: All
- [ ] Layout: Portrait
- [ ] Color: Color (will print B&W on thermal)
- [ ] More Settings → Margins: None

### 3. **Thermal Print Output**
- [ ] Paper width: 80mm
- [ ] Text is clear and readable
- [ ] Logo prints (if configured)
- [ ] All sections print correctly
- [ ] Dashed lines print properly
- [ ] No truncation of text
- [ ] Alignment is correct
- [ ] Both ORIGINAL and CUSTOMER COPY print
- [ ] Paper cuts cleanly after printing

## API Testing ✅

### Test Receipt Endpoint:
```powershell
# Get auth token first
$token = (Invoke-WebRequest -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@factssolution.com","password":"admin123"}' | ConvertFrom-Json).data.token

# Test receipt endpoint (replace ORDER_ID with actual order ID)
$headers = @{ Authorization = "Bearer $token" }
Invoke-WebRequest -Uri "http://localhost:5000/api/v1/orders/1/receipt" -Headers $headers | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

Expected response structure:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "token_number": 1,
      "items": [
        {
          "index": 1,
          "product_name": "...",
          "quantity": 1,
          "price": 100.00,
          "total": 100.00
        }
      ],
      "subtotal": 100.00,
      "tax_amount": 18.00,
      "total_amount": 118.00
    },
    "settings": {
      "company_name": "...",
      "company_address": "...",
      "tax_rate": "18"
    }
  }
}
```

## Edge Cases Testing ✅

- [ ] Order with 1 item
- [ ] Order with 10+ items
- [ ] Order without customer name
- [ ] Order with customer phone
- [ ] Different payment methods (cash, card, UPI)
- [ ] Zero tax rate
- [ ] High tax rate (e.g., 25%)
- [ ] Very long product names
- [ ] Very short product names
- [ ] Products with decimal prices
- [ ] Logo not configured (should hide gracefully)
- [ ] Settings partially configured

## Performance Testing ✅

- [ ] Receipt loads within 2 seconds
- [ ] Print preview generates quickly
- [ ] No browser freezing
- [ ] Memory usage is normal
- [ ] Multiple receipts can be printed sequentially

## Browser Compatibility ✅

Test in:
- [ ] Google Chrome (recommended)
- [ ] Microsoft Edge
- [ ] Firefox
- [ ] Safari (if on Mac)

## Thermal Printer Models Tested ✅

- [ ] Epson TM-T88VI
- [ ] Star TSP143III
- [ ] Bixolon SRP-350III
- [ ] Other (specify): __________

## Known Issues ❌

List any issues found during testing:
1. ____________________________
2. ____________________________
3. ____________________________

## Sign-Off ✅

**Tested By**: ___________________  
**Date**: ___________________  
**Result**: ☐ PASS  ☐ FAIL  
**Comments**: ___________________

---

## Quick Test Command

Run this to test the complete flow:
```bash
# 1. Restart backend
.\RESTART-BACKEND-RECEIPT.bat

# 2. Open browser
http://localhost:3000

# 3. Login
admin@factssolution.com / admin123

# 4. Go to POS
# 5. Add products to cart
# 6. Checkout
# 7. Verify receipt
# 8. Print test
```

---

**Testing Status**: ⏳ Pending  
**Last Tested**: N/A  
**Version**: 2.0.0
