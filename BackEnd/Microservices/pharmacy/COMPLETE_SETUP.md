# Complete Image Upload Implementation - Full Documentation

## ✅ Implementation Complete

All necessary files have been created and configured for image upload functionality using ImgBB API.

---

## 📋 Quick Summary

| Component | File | Purpose |
|-----------|------|---------|
| **Service** | `ImgbbService.java` | Handles ImgBB API calls and image uploads |
| **Service** | `PharmacyService.java` | Manages pharmacy image uploads (banner, logo) |
| **Service** | `MedicationService.java` | Manages medication image uploads |
| **Controller** | `PharmacyController.java` | REST endpoints for pharmacy images |
| **Controller** | `MedicationController.java` | REST endpoints for medication images |
| **Utility** | `ImageUtils.java` | Base64 image encoding |
| **Config** | `RestTemplateConfig.java` | Spring HTTP client configuration |
| **Entity** | `Pharmacy.java` | Updated with `bannerUrl`, `logoUrl` fields |
| **Entity** | `Medication.java` | Updated with `imageUrl` field |
| **Properties** | `application.properties` | ImgBB API key configuration |

---

## 🔌 API Endpoints

### Pharmacy Endpoints

#### 1. Upload Banner
```
POST /pharmacies/{pharmacyId}/upload-banner
Content-Type: multipart/form-data

Parameters:
- file: MultipartFile (image file)

Response:
{
  "id": 1,
  "name": "Pharmacy Name",
  "bannerUrl": "https://i.ibb.co/...",
  "logoUrl": null,
  ...
}
```

#### 2. Upload Logo
```
POST /pharmacies/{pharmacyId}/upload-logo
Content-Type: multipart/form-data

Parameters:
- file: MultipartFile (image file)

Response:
{
  "id": 1,
  "name": "Pharmacy Name",
  "bannerUrl": null,
  "logoUrl": "https://i.ibb.co/...",
  ...
}
```

#### 3. Upload Both Images
```
POST /pharmacies/{pharmacyId}/upload-images
Content-Type: multipart/form-data

Parameters:
- banner: MultipartFile (optional)
- logo: MultipartFile (optional)

Response:
{
  "id": 1,
  "name": "Pharmacy Name",
  "bannerUrl": "https://i.ibb.co/...",
  "logoUrl": "https://i.ibb.co/...",
  ...
}
```

### Medication Endpoints

#### Upload Image
```
POST /medications/{medicationId}/upload-image
Content-Type: multipart/form-data

Parameters:
- file: MultipartFile (image file)

Response:
{
  "id": 1,
  "name": "Aspirin",
  "imageUrl": "https://i.ibb.co/...",
  ...
}
```

---

## 🛠️ How It Works

```
┌─────────────────┐
│  Client/Frontend│
└────────┬────────┘
         │ 1. Upload image file (multipart/form-data)
         ▼
┌─────────────────┐
│   Controller    │ (PharmacyController / MedicationController)
└────────┬────────┘
         │ 2. Receives file
         ▼
┌─────────────────┐
│    Service      │ (PharmacyService / MedicationService)
└────────┬────────┘
         │ 3. Convert to Base64
         ▼
┌─────────────────┐
│  ImageUtils     │
└────────┬────────┘
         │ 4. Base64 string ready
         ▼
┌─────────────────┐
│  ImgbbService   │
└────────┬────────┘
         │ 5. Send to ImgBB API
         ▼
┌─────────────────┐
│   ImgBB API     │
└────────┬────────┘
         │ 6. Return image URL
         ▼
┌─────────────────┐
│    Service      │
└────────┬────────┘
         │ 7. Store URL in database
         ▼
┌─────────────────┐
│   Database      │
└────────┬────────┘
         │ 8. URL persisted
         ▼
┌─────────────────┐
│   Controller    │
└────────┬────────┘
         │ 9. Return updated entity
         ▼
┌─────────────────┐
│  Client/Frontend│
└─────────────────┘
```

---

## 📦 Files Overview

### 1. ImgbbService.java
**Purpose**: Core service for ImgBB API integration

**Key Method**:
```java
public String uploadImage(String imageBase64)
```

**Inner Classes**:
- `ImgbbResponse` - API response DTO
- `ImgbbData` - Image data from API

**Configuration**:
- API Key: `${imgbb.apiKey}` from `application.properties`
- URL: `https://api.imgbb.com/1/upload`

### 2. PharmacyService.java
**Purpose**: Business logic for pharmacy operations

**Image Methods**:
- `uploadBannerImage(Long pharmacyId, MultipartFile bannerFile)`
- `uploadLogoImage(Long pharmacyId, MultipartFile logoFile)`
- `uploadPharmacyImages(Long pharmacyId, MultipartFile bannerFile, MultipartFile logoFile)`

**Database Fields Updated**:
- `bannerUrl: String (TEXT)`
- `logoUrl: String (TEXT)`

### 3. MedicationService.java
**Purpose**: Business logic for medication operations

**Image Method**:
- `uploadImage(Long medicationId, MultipartFile imageFile)`

**Database Field Added**:
- `imageUrl: String (TEXT)`

### 4. PharmacyController.java
**Purpose**: REST API endpoints for pharmacy operations

**Image Endpoints**:
- `POST /pharmacies/{id}/upload-banner`
- `POST /pharmacies/{id}/upload-logo`
- `POST /pharmacies/{id}/upload-images`

### 5. MedicationController.java
**Purpose**: REST API endpoints for medication operations

**Image Endpoint**:
- `POST /medications/{id}/upload-image`

### 6. ImageUtils.java
**Purpose**: Utility functions for image processing

**Methods**:
- `convertToBase64(MultipartFile file)` - Converts file to Base64 string

### 7. RestTemplateConfig.java
**Purpose**: Spring configuration for HTTP client

**Bean**:
- `RestTemplate` - For making HTTP requests to ImgBB API

---

## ⚙️ Configuration

### application.properties
```properties
imgbb.apiKey=7bb3de6db06d8c031f74de454696bef9
```

### pom.xml Dependencies
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

---

## 🗄️ Database Schema

### Pharmacy Table
```sql
ALTER TABLE pharmacy ADD COLUMN banner_url TEXT;
ALTER TABLE pharmacy ADD COLUMN logo_url TEXT;
```

### Medication Table
```sql
ALTER TABLE medication ADD COLUMN image_url TEXT;
```

---

## 💻 Usage Examples

### cURL - Upload Pharmacy Banner
```bash
curl -X POST http://localhost:8090/pharmacies/1/upload-banner \
  -F "file=@banner.jpg"
```

### cURL - Upload Medication Image
```bash
curl -X POST http://localhost:8090/medications/1/upload-image \
  -F "file=@medication.jpg"
```

### JavaScript - Upload Image
```javascript
const uploadPharmacyBanner = async (pharmacyId, imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch(
    `http://localhost:8090/pharmacies/${pharmacyId}/upload-banner`,
    {
      method: 'POST',
      body: formData
    }
  );
  
  const data = await response.json();
  console.log('Banner URL:', data.bannerUrl);
  return data;
};

const uploadMedicationImage = async (medicationId, imageFile) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch(
    `http://localhost:8090/medications/${medicationId}/upload-image`,
    {
      method: 'POST',
      body: formData
    }
  );
  
  const data = await response.json();
  console.log('Image URL:', data.imageUrl);
  return data;
};
```

### React Component Example
```javascript
import React, { useState } from 'react';

const ImageUploadComponent = ({ pharmacyId }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `http://localhost:8090/pharmacies/${pharmacyId}/upload-banner`,
        {
          method: 'POST',
          body: formData
        }
      );
      const data = await response.json();
      setImageUrl(data.bannerUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload</button>
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
};

export default ImageUploadComponent;
```

---

## ✔️ Compilation Status

```
✅ BUILD SUCCESS
Total time: 2.343 s
23 source files compiled successfully
```

---

## 🧪 Testing Guide

### 1. Test Pharmacy Banner Upload
```bash
# Step 1: Create a pharmacy
curl -X POST http://localhost:8090/pharmacies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Pharmacy",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'

# Step 2: Upload banner (assuming ID is 1)
curl -X POST http://localhost:8090/pharmacies/1/upload-banner \
  -F "file=@banner.jpg"

# Step 3: Get pharmacy and verify bannerUrl
curl http://localhost:8090/pharmacies/1
```

### 2. Test Medication Image Upload
```bash
# Step 1: Create a medication
curl -X POST http://localhost:8090/medications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aspirin"
  }'

# Step 2: Upload image (assuming ID is 1)
curl -X POST http://localhost:8090/medications/1/upload-image \
  -F "file=@medication.jpg"

# Step 3: Get medication and verify imageUrl
curl http://localhost:8090/medications/1
```

---

## 🔒 Security Notes

1. **API Key Protection**
   - Currently in `application.properties` (visible in code)
   - For production, use environment variables:
   ```bash
   export IMGBB_API_KEY=7bb3de6db06d8c031f74de454696bef9
   ```
   - Update `application.properties`:
   ```properties
   imgbb.apiKey=${IMGBB_API_KEY}
   ```

2. **File Validation**
   - Validates file is not empty
   - Content-type check in controller
   - Consider adding file size limits

3. **HTTPS**
   - Always use HTTPS in production
   - ImgBB API supports HTTPS

---

## ⚠️ Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Empty file | Check file is selected |
| 404 Not Found | Entity doesn't exist | Verify ID exists |
| 500 Server Error | ImgBB API error | Check API key, internet connection |
| 500 Server Error | Invalid Base64 | Check file is readable |

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Upload successful |
| 400 | Bad request (invalid file) |
| 404 | Entity not found |
| 500 | Server error |

---

## 🎯 Next Steps

1. **Database Migration**
   - Run migration scripts to add new columns
   - Or use Hibernate auto-update (already configured)

2. **Testing**
   - Test with real image files
   - Verify URLs work in browsers
   - Test error scenarios

3. **Frontend Integration**
   - Create upload UI components
   - Display images using returned URLs
   - Handle upload progress

4. **Production Deployment**
   - Secure API key with environment variables
   - Enable HTTPS
   - Set up logging and monitoring

---

## 📚 File Locations

```
pharmacy/
├── src/main/java/com/pidev/pharmacy/
│   ├── config/
│   │   └── RestTemplateConfig.java ✅
│   ├── controllers/
│   │   ├── PharmacyController.java ✅
│   │   └── MedicationController.java ✅
│   ├── entities/
│   │   ├── Pharmacy.java ✅
│   │   └── Medication.java ✅
│   ├── services/
│   │   ├── ImgbbService.java ✅
│   │   ├── PharmacyService.java ✅
│   │   └── MedicationService.java ✅
│   └── utils/
│       └── ImageUtils.java ✅
├── src/main/resources/
│   └── application.properties ✅
└── pom.xml ✅
```

---

## 📞 Support

For issues:
1. Check application logs for error messages
2. Verify ImgBB API key is correct
3. Ensure internet connection is available
4. Check database connectivity
5. Review error response details

---

## 🎉 You're All Set!

All components are ready to use. Start uploading images to ImgBB and storing URLs in your database!


