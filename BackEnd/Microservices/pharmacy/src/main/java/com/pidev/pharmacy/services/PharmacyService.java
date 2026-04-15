package com.pidev.pharmacy.services;
import com.pidev.pharmacy.dto.PharmacyUpdateInfoDTO;
import com.pidev.pharmacy.dto.PharmacyUpdateLocationDTO;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.repositories.InventoryTransactionRepository;
import com.pidev.pharmacy.repositories.MedicationStockRepository;
import com.pidev.pharmacy.repositories.PharmacistRepository;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import com.pidev.pharmacy.repositories.RatingRepository;
import com.pidev.pharmacy.repositories.ReportRepository;
import com.pidev.pharmacy.repositories.WorkingHoursRepository;
import com.pidev.pharmacy.utils.ImageUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@AllArgsConstructor
public class PharmacyService implements IService<Pharmacy> {

    private final PharmacyRepository pharmacyRepository;
    private final ImgbbService imgbbService;
    private final MedicationStockRepository medicationStockRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final RatingRepository ratingRepository;
    private final ReportRepository reportRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final PharmacistRepository pharmacistRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Pharmacy> getAll() {
        return pharmacyRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Pharmacy getById(Long id) {
        return pharmacyRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Pharmacy not found with id: " + id));
    }

    @Override
    public Pharmacy create(Pharmacy entity) {
        entity.setId(null);
        return pharmacyRepository.save(entity);
    }

    @Override
    public Pharmacy update(Long id, Pharmacy entity) {
        Pharmacy existing = getById(id);
        existing.setName(entity.getName());
        existing.setAddress(entity.getAddress());
        existing.setLatitude(entity.getLatitude());
        existing.setLongitude(entity.getLongitude());
        return pharmacyRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Pharmacy existing = getById(id);

        // Cascade delete dependents that reference pharmacy_id to avoid FK violations.
        // Order here doesn't matter as long as everything referencing the pharmacy is removed first.
        inventoryTransactionRepository.deleteByPharmacyId(id);
        medicationStockRepository.deleteByPharmacyId(id);
        workingHoursRepository.deleteByPharmacyId(id);
        ratingRepository.deleteByPharmacyId(id);
        reportRepository.deleteByPharmacyId(id);
        pharmacistRepository.deleteByPharmacy_Id(id);

        pharmacyRepository.delete(existing);
    }

    @Transactional
    public Pharmacy uploadBannerImage(Long pharmacyId, MultipartFile bannerFile) throws IOException {
        Pharmacy pharmacy = getById(pharmacyId);
        String base64Image = ImageUtils.convertToBase64(bannerFile);
        String imageUrl = imgbbService.uploadImage(base64Image);
        pharmacy.setBannerUrl(imageUrl);
        return pharmacyRepository.save(pharmacy);
    }

    @Transactional
    public Pharmacy uploadLogoImage(Long pharmacyId, MultipartFile logoFile) throws IOException {
        Pharmacy pharmacy = getById(pharmacyId);
        String base64Image = ImageUtils.convertToBase64(logoFile);
        String imageUrl = imgbbService.uploadImage(base64Image);
        pharmacy.setLogoUrl(imageUrl);
        return pharmacyRepository.save(pharmacy);
    }

    @Transactional
    public Pharmacy uploadPharmacyImages(Long pharmacyId, MultipartFile bannerFile, MultipartFile logoFile) throws IOException {
        Pharmacy pharmacy = getById(pharmacyId);

        if (bannerFile != null && !bannerFile.isEmpty()) {
            String base64Image = ImageUtils.convertToBase64(bannerFile);
            String imageUrl = imgbbService.uploadImage(base64Image);
            pharmacy.setBannerUrl(imageUrl);
        }

        if (logoFile != null && !logoFile.isEmpty()) {
            String base64Image = ImageUtils.convertToBase64(logoFile);
            String imageUrl = imgbbService.uploadImage(base64Image);
            pharmacy.setLogoUrl(imageUrl);
        }

        return pharmacyRepository.save(pharmacy);
    }

    @Transactional
    public Pharmacy updatePharmacyInfo(Long id, PharmacyUpdateInfoDTO dto) {
        Pharmacy existing = getById(id);
        if (dto.getName() != null) {
            existing.setName(dto.getName());
        }
        if (dto.getAddress() != null) {
            existing.setAddress(dto.getAddress());
        }
        if (dto.getDescription() != null) {
            existing.setDescription(dto.getDescription());
        }
        if (dto.getContactInfo() != null) {
            existing.setContactInfo(dto.getContactInfo());
        }
        if (dto.getBannerUrl() != null) {
            existing.setBannerUrl(dto.getBannerUrl());
        }
        if (dto.getLogoUrl() != null) {
            existing.setLogoUrl(dto.getLogoUrl());
        }
        return pharmacyRepository.save(existing);
    }

    @Transactional
    public Pharmacy updatePharmacyLocation(Long id, PharmacyUpdateLocationDTO dto) {
        Pharmacy existing = getById(id);
        if (dto.getAddress() != null) {
            existing.setAddress(dto.getAddress());
        }
        if (dto.getLongitude() != null) {
            existing.setLongitude(dto.getLongitude());
        }
        if (dto.getLatitude() != null) {
            existing.setLatitude(dto.getLatitude());
        }
        return pharmacyRepository.save(existing);
    }
}