package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.Pharmacist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PharmacistRepository extends JpaRepository<Pharmacist, Long> {
    List<Pharmacist> findByUserId(UUID userId);

    List<Pharmacist> findByUserIdOrderByIdDesc(UUID userId);
    
    List<Pharmacist> findByPharmacy_Id(Long pharmacyId);

    long deleteByPharmacy_Id(Long pharmacyId);
}
