package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByPharmacyId(Long pharmacyId);

    long deleteByPharmacyId(Long pharmacyId);

    List<Rating> findByUsernameIgnoreCase(String username);

    List<Rating> findByIsFavoriteTrue();
}
