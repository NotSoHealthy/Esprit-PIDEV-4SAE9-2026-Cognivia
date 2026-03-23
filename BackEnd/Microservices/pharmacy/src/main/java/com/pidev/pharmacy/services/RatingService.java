package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.Rating;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import com.pidev.pharmacy.repositories.RatingRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
public class RatingService implements IService<Rating> {

    private final RatingRepository ratingRepository;
    private final PharmacyRepository pharmacyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Rating> getAll() {
        return ratingRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Rating getById(Long id) {
        return ratingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rating not found with id: " + id));
    }

    @Override
    @Transactional
    public Rating create(Rating entity) {
        entity.setId(null);
        validateRating(entity.getRating());

        Pharmacy pharmacy = pharmacyRepository.findById(entity.getPharmacy().getId())
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + entity.getPharmacy().getId()));
        entity.setPharmacy(pharmacy);

        if (entity.getIsFavorite() == null) {
            entity.setIsFavorite(false);
        }

        return ratingRepository.save(entity);
    }

    @Override
    @Transactional
    public Rating update(Long id, Rating entity) {
        Rating existing = getById(id);
        if (entity.getRating() != null) {
            validateRating(entity.getRating());
            existing.setRating(entity.getRating());
        }
        if (entity.getUsername() != null) {
            existing.setUsername(entity.getUsername());
        }
        if (entity.getComment() != null) {
            existing.setComment(entity.getComment());
        }
        if (entity.getIsFavorite() != null) {
            existing.setIsFavorite(entity.getIsFavorite());
        }
        return ratingRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        ratingRepository.delete(getById(id));
    }

    @Transactional(readOnly = true)
    public List<Rating> getByPharmacy(Long pharmacyId) {
        return ratingRepository.findByPharmacyId(pharmacyId);
    }

    @Transactional(readOnly = true)
    public double getAverageForPharmacy(Long pharmacyId) {
        List<Rating> ratings = ratingRepository.findByPharmacyId(pharmacyId);
        if (ratings.isEmpty()) {
            return 0.0;
        }
        return ratings.stream().mapToInt(Rating::getRating).average().orElse(0.0);
    }

    @Transactional(readOnly = true)
    public List<Pharmacy> getFavoritePharmacies() {
        return ratingRepository.findByIsFavoriteTrue().stream()
                .map(Rating::getPharmacy)
                .distinct()
                .toList();
    }

    private void validateRating(Integer stars) {
        if (stars == null || stars < 0 || stars > 5) {
            throw new RuntimeException("Rating must be between 0 and 5");
        }
    }
}
