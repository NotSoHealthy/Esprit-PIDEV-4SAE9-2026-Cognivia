# Image Upload API - Quick Reference

## Pharmacy Image Upload Endpoints

### 1. Upload Banner Image
**POST** `/pharmacies/{id}/upload-banner`
- **Parameter**: `file` (MultipartFile) - The banner image
- **Returns**: Updated Pharmacy with bannerUrl populated

```bash
curl -X POST http://localhost:8090/pharmacies/1/upload-banner \
  -F "file=@banner.jpg"
```

### 2. Upload Logo Image
**POST** `/pharmacies/{id}/upload-logo`
- **Parameter**: `file` (MultipartFile) - The logo image
- **Returns**: Updated Pharmacy with logoUrl populated

```bash
curl -X POST http://localhost:8090/pharmacies/1/upload-logo \
  -F "file=@logo.png"
```

### 3. Upload Both Banner and Logo
**POST** `/pharmacies/{id}/upload-images`
- **Parameters**: 
  - `banner` (MultipartFile, optional)
  - `logo` (MultipartFile, optional)
- **Returns**: Updated Pharmacy with both URLs populated

```bash
curl -X POST http://localhost:8090/pharmacies/1/upload-images \
  -F "banner=@banner.jpg" \
  -F "logo=@logo.png"
```

## Medication Image Upload Endpoint

### Upload Medication Image
**POST** `/medications/{id}/upload-image`
- **Parameter**: `file` (MultipartFile) - The medication image
- **Returns**: Updated Medication with imageUrl populated

```bash
curl -X POST http://localhost:8090/medications/1/upload-image \
  -F "file=@medication.jpg"
```

## How It Works

1. **File Upload**: Client sends image file via multipart/form-data
2. **Base64 Encoding**: Image is converted to Base64 string
3. **ImgBB Upload**: Base64 string is sent to ImgBB API
4. **URL Storage**: Returned image URL is stored in database
5. **Response**: Updated entity is returned with image URL

## Configuration

The ImgBB API key is configured in `application.properties`:
```properties
imgbb.apiKey=7bb3de6db06d8c031f74de454696bef9
```

## Database Fields

### Pharmacy Entity
- `bannerUrl` (TEXT) - URL for banner image
- `logoUrl` (TEXT) - URL for logo image

### Medication Entity
- `imageUrl` (TEXT) - URL for medication image

## Example Response

```json
{
  "id": 1,
  "name": "My Pharmacy",
  "address": "123 Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "bannerUrl": "https://i.ibb.co/abc123/banner.jpg",
  "logoUrl": "https://i.ibb.co/def456/logo.png",
  "createdAt": "2026-03-02T00:00:00Z",
  "updatedAt": "2026-03-02T00:44:00Z"
}
```

## Error Handling

- **400 Bad Request**: Empty file or missing required parameters
- **404 Not Found**: Entity ID doesn't exist
- **500 Internal Server Error**: ImgBB API error or network issue

## Files Created/Modified

### New Files
- `ImgbbService.java` - Service for ImgBB API integration
- `MedicationService.java` - Service for medication operations with image upload
- `MedicationController.java` - REST controller for medications
- `ImageUtils.java` - Utility for Base64 conversion

### Modified Files
- `PharmacyService.java` - Added image upload methods
- `PharmacyController.java` - Added image upload endpoints
- `Pharmacy.java` - Added bannerUrl and logoUrl fields
- `Medication.java` - Added imageUrl field
- `pom.xml` - Added spring-boot-starter-webflux dependency
- `application.properties` - Added imgbb.apiKey property

## Usage Example (JavaScript/Frontend)

```javascript
// Upload pharmacy banner
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:8090/pharmacies/1/upload-banner', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Banner URL:', data.bannerUrl);
});

// Upload medication image
const medFormData = new FormData();
medFormData.append('file', fileInput.files[0]);

fetch('http://localhost:8090/medications/1/upload-image', {
  method: 'POST',
  body: medFormData
})
.then(response => response.json())
.then(data => {
  console.log('Medication Image URL:', data.imageUrl);
});
```

