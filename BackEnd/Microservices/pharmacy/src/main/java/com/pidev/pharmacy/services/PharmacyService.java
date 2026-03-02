package com.pidev.pharmacy.services;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.repositories.PharmacyRepository;
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
    public void delete(Long id) {
        Pharmacy existing = getById(id);
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
}