package com.esprit.microservice.surveillanceandequipment.Repositories;

import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentPartRepository extends JpaRepository<EquipmentPart, Long> {
    List<EquipmentPart> findByEquipmentId(Long equipmentId);
}
