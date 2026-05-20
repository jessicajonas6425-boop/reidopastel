# Security Specification - Rei do Pastel

This document defines the security boundaries, security rules testing payloads, and security assertions for the firestore database of Rei do Pastel.

## 1. Data Invariants

1. **Authentication Boundary**: 
   - Public users can only read products, shop settings, and they can create new orders.
   - Public users are forbidden from creating, updating, or deleting any product or general shop settings.
   - Admin access is strictly locked to users verified through authentic claims, specifically matching bootstrap address `tudojonas38@gmail.com`.

2. **Order Constraints**:
   - Creating an order is allowed anonymously or authenticated. Once created, only an Administrator can modify the status. Customers cannot change details once submitted.
   - Order IDs must be protected against ID Poisoning.

3. **Shop Settings Constraints**:
   - Read-only for public. Write is strictly restricted to authenticated Administrators.

4. **Product Constraints**:
   - Read-only for public. Write, update, and delete are strictly restricted to authenticated Administrators.

---

## 2. The "Dirty Dozen" Payloads

The following payloads attempt to compromise application layers. Under the Fortress Security Rules, they will return `PERMISSION_DENIED`.

1. **Payload 1: Privilege Escalation on Products (Create Product as Anonymous)**
   - Path: `/products/hack-prod`
   - Content: `{ "name": "Fake Pastel", "price": 1, "category": "NACIONALIDADES", "available": true }`
   - Result: `PERMISSION_DENIED`

2. **Payload 2: Bypass Admin Restrictions on Settings (Modify Instagram Link)**
   - Path: `/settings/config`
   - Content: `{ "instagram": "@hacked" }`
   - Result: `PERMISSION_DENIED`

3. **Payload 3: ID Poisoning Attack on Order Submission**
   - Path: `/orders/a-very-long-id-poisoning-garbage-string-exceeding-the-size-limitations-of-the-id-field-to-exhaust-system-resources-and-cause-denial-of-wallet`
   - Content: `{ "customerName": "Test", "customerPhone": "123", "items": [], "paymentMethod": "Pix", "deliveryMethod": "pickup", "totalItems": 0, "deliveryFee": 0, "totalOrder": 0, "status": "pending", "createdAt": "2026-05-20T17:41:20Z" }`
   - Result: `PERMISSION_DENIED`

4. **Payload 4: Hostile Product Tampering (Update Existing Product Name)**
   - Path: `/products/nac-arabe`
   - Content: `{ "name": "Hacked Pastel Name" }`
   - Result: `PERMISSION_DENIED`

5. **Payload 5: Attempting Malicious Product Deletion**
   - Path: `/products/nac-arabe`
   - Action: `delete`
   - Result: `PERMISSION_DENIED`

6. **Payload 6: Spoofing Order Ownership or Status to Complete Orders Directly**
   - Path: `/orders/RP-1002`
   - Content: `{ "status": "delivered", "totalOrder": 0 }`
   - Result: `PERMISSION_DENIED`

7. **Payload 7: Injecting Ghost Fields into the Products Collection**
   - Path: `/products/new-prod`
   - Content: `{ "id": "new-prod", "name": "Test", "price": 10, "category": "NACIONALIDADES", "available": true, "isPremiumGiftField": true }`
   - Result: `PERMISSION_DENIED`

8. **Payload 8: Submitting an Order with Missing Required Fields (Schema bypass)**
   - Path: `/orders/RP-9999`
   - Content: `{ "id": "RP-9999", "customerName": "Test" }`
   - Result: `PERMISSION_DENIED`

9. **Payload 9: Self-Allocating Custom Admin Roles**
   - Path: `/admins/hostile-uid`
   - Content: `{ "email": "tudojonas38@gmail.com", "role": "admin" }`
   - Result: `PERMISSION_DENIED`

10. **Payload 10: Modifying Relational Fields during Order updates**
    - Path: `/orders/RP-9991`
    - Content: `{ "customerName": "New Target Customer", "totalOrder": 100 }`
    - Result: `PERMISSION_DENIED`

11. **Payload 11: Spoofing Client Timestamps rather than Server request.time**
    - Path: `/orders/RP-9992`
    - Content: `{ "createdAt": "2020-01-01T00:00:00Z" }`
    - Result: `PERMISSION_DENIED`

12. **Payload 12: Anonymous Attempt to Read/List All Orders**
    - Path: `/orders`
    - Action: `list` (without Admin privilege)
    - Result: `PERMISSION_DENIED`
