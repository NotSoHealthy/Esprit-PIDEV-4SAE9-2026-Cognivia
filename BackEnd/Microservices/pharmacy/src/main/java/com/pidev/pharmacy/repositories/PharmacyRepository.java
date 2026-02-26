package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.Pharmacy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {

    List<Pharmacy> findByName(String name);
    List<Pharmacy> findByAddress(String address);
}
