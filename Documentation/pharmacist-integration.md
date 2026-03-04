# Pharmacist Integration Guide

## Overview
The Pharmacist entity has been successfully integrated into the pharmacy microservice following the same architecture pattern used for Doctor, Patient, and Caregiver in the care microservice.

---

## Backend Implementation (Java/Spring Boot)

### 1. **Entity Layer**
**File**: `Pharmacist.java`
- JPA entity with `@Entity` annotation
- Fields:
  - `id` (Long) - Primary key with auto-increment
  - `userId` (UUID) - Unique field to link with Keycloak users
  - `firstName`, `lastName` - Basic information
  - `licenseNumber` - Professional credential
  - `phoneNumber` - Contact information
  - `pharmacy` - ManyToOne relationship to Pharmacy entity

### 2. **Repository Layer**
**File**: `PharmacistRepository.java`
- Extends `JpaRepository<Pharmacist, Long>`
- Custom query methods:
  - `findByUserId(UUID userId)` - Find pharmacist by Keycloak user ID
  - `findByPharmacyId(Long pharmacyId)` - Find all pharmacists at a pharmacy

### 3. **Service Layer**
**File**: `PharmacistService.java`
- Implements `IService<Pharmacist>`
- CRUD operations: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- Custom methods:
  - `getByUserId(UUID userId)` - Retrieves pharmacist linked to Keycloak user
  - `getByPharmacyId(Long pharmacyId)` - Lists all pharmacists at a pharmacy

### 4. **Controller Layer**
**File**: `PharmacistController.java`
- REST API endpoints at `/pharmacist`
- **Key endpoints**:
  ```
  GET    /pharmacist              - List all pharmacists
  GET    /pharmacist/{id}         - Get by ID
  GET    /pharmacist/user/{userId} - Get by Keycloak user ID
  GET    /pharmacist/pharmacy/{pharmacyId} - List by pharmacy
  POST   /pharmacist              - Create new pharmacist
  POST   /pharmacist/register/{userId} - Register pharmacist with Keycloak user
  PUT    /pharmacist/{id}         - Update pharmacist
  DELETE /pharmacist/{id}         - Delete pharmacist
  ```

---

## Frontend Implementation (Angular/TypeScript)

### 1. **Service Layer**
**File**: `pharmacist.service.ts`
- Angular service to consume REST API
- Methods mirror backend endpoints
- Includes Pharmacist interface definition

### 2. **Profile Component**
**Files**: 
- `pharmacist.ts` - Component logic
- `pharmacist.html` - Template
- `pharmacist.css` - Styles

**Features**:
- Reactive form with validation
- Loads existing pharmacist data on init
- Creates new profile if none exists
- Updates existing profile
- Form fields:
  - First Name (required)
  - Last Name (required)
  - License Number (required, alphanumeric)
  - Phone Number (required, 8 digits)

### 3. **Integration Points**
- **Profile Routing**: Updated `profile.ts` to include Pharmacist component
- **Profile Template**: Added `ROLE_PHARMACY` case in `profile.html`
- **Dashboard**: Pharmacy role already included in app-layout routes
- **Navigation**: Profile accessible from header dropdown for all authenticated users

---

## Keycloak Integration Flow

### User Registration → Profile Creation

1. **User registers** in Keycloak with email/password
2. **Admin assigns** `ROLE_PHARMACY` role in Keycloak
3. **User logs in** to the application
4. **User navigates** to Profile page (from header dropdown)
5. **System checks** for existing pharmacist record using `GET /pharmacist/user/{userId}`
   - If found: Form populates with existing data
   - If not found: Form shows empty
6. **User fills form** and clicks "Save Profile"
7. **System creates** pharmacist record via `POST /pharmacist/register/{userId}`
8. **Backend links** pharmacist to user via `userId` field
9. **Profile is complete** and available for future edits

### Key Points
- `userId` (UUID) is the **bridge** between Keycloak and the database
- The `/register/{userId}` endpoint automatically sets the `userId` field
- Users can update their profile anytime via the same form
- The profile is **role-specific** - only users with `ROLE_PHARMACY` see the pharmacist form

---

## API Usage Examples

### Creating a Pharmacist (via registration)
```bash
POST /pharmacy/pharmacist/register/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "licenseNumber": "PH123456",
  "phoneNumber": "12345678"
}
```

### Getting Pharmacist by Keycloak User ID
```bash
GET /pharmacy/pharmacist/user/123e4567-e89b-12d3-a456-426614174000
```
Response:
```json
{
  "id": 1,
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "firstName": "John",
  "lastName": "Doe",
  "licenseNumber": "PH123456",
  "phoneNumber": "12345678",
  "pharmacy": null
}
```

### Frontend Usage
```typescript
// In component
const userId = this.keycloak.getUserId();

// Create profile
this.pharmacistService.registerPharmacist(userId, pharmacistData)
  .subscribe(result => {
    console.log('Profile created:', result);
  });

// Load existing profile
this.pharmacistService.getPharmacistByUserId(userId)
  .subscribe(pharmacist => {
    this.form.patchValue(pharmacist);
  });
```

---

## Architecture Pattern Summary

This implementation follows the **4-layer REST architecture**:

```
┌─────────────────────────────────────────┐
│  Frontend (Angular)                     │
│  - Profile Component                    │
│  - Pharmacist Service                   │
└──────────────┬──────────────────────────┘
               │ HTTP REST API
               ▼
┌─────────────────────────────────────────┐
│  Controller Layer                       │
│  @RestController                        │
│  @RequestMapping("/pharmacist")         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Service Layer                          │
│  @Service implements IService           │
│  Business logic + getByUserId()         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Repository Layer                       │
│  extends JpaRepository                  │
│  Custom: findByUserId(UUID)             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Entity Layer                           │
│  @Entity - JPA/Hibernate                │
│  Database: pharmacist table             │
└─────────────────────────────────────────┘
```

---

## Testing the Integration

### 1. **Backend Testing**
Start the pharmacy microservice and test:
```bash
# Create a pharmacist
curl -X POST http://localhost:8080/pharmacy/pharmacist/register/test-uuid-123 \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Smith","licenseNumber":"PH789","phoneNumber":"87654321"}'

# Get by user ID
curl http://localhost:8080/pharmacy/pharmacist/user/test-uuid-123
```

### 2. **Frontend Testing**
1. Register a new user in Keycloak
2. Assign `ROLE_PHARMACY` role
3. Log into the application
4. Click profile dropdown → "Profile"
5. Fill in pharmacist profile form
6. Click "Save Profile"
7. Verify success message
8. Refresh page - form should populate with saved data

---

## Files Created/Modified

### Backend (Java)
✅ `entities/Pharmacist.java`
✅ `repositories/PharmacistRepository.java`
✅ `services/PharmacistService.java`
✅ `controllers/PharmacistController.java`

### Frontend (TypeScript/Angular)
✅ `services/pharmacy/pharmacist.service.ts`
✅ `features/profile/pharmacist/pharmacist.ts`
✅ `features/profile/pharmacist/pharmacist.html`
✅ `features/profile/pharmacist/pharmacist.css`
✅ `features/profile/profile.ts` (updated)
✅ `features/profile/profile.html` (updated)

---

## Security & Authorization

- All API endpoints can be secured with Spring Security
- Frontend guards already protect routes by role
- Profile page accessible to all authenticated users
- Each user only sees/edits their own profile (enforced by `userId`)
- Consider adding:
  - `@PreAuthorize("hasRole('PHARMACY')")` on controller methods
  - Backend validation that user can only update their own profile
  - Audit logging for profile changes

---

## Next Steps (Optional Enhancements)

1. **Link Pharmacist to Pharmacy**:
   - Add dropdown in profile form to select/assign pharmacy
   - Update `PharmacistService.update()` to handle pharmacy assignment

2. **Profile Photo Upload**:
   - Add image upload field
   - Store profile photo URL (similar to pharmacy banner/logo)

3. **Pharmacy Dashboard Integration**:
   - Show pharmacist name in pharmacy dashboard
   - Display which pharmacists are assigned to which pharmacies

4. **Admin Management**:
   - Create admin page to manage all pharmacists
   - Assign pharmacists to pharmacies
   - View/edit all pharmacist profiles

5. **Validation Enhancements**:
   - Verify license number uniqueness
   - Add email field linked to Keycloak
   - Add address/location fields

---

## Comparison with Doctor/Patient Pattern

| Feature | Doctor (Care) | Patient (Care) | Pharmacist (Pharmacy) |
|---------|--------------|----------------|----------------------|
| Entity | ✅ | ✅ | ✅ |
| Repository with `findByUserId` | ✅ | ✅ | ✅ |
| Service with `getByUserId()` | ✅ | ✅ | ✅ |
| Controller `/register/{userId}` | ✅ | ✅ | ✅ |
| Frontend Service | ✅ | ✅ | ✅ |
| Profile Component | ✅ | ✅ | ✅ |
| Keycloak Integration | ✅ | ✅ | ✅ |

✅ **All patterns successfully replicated!**
