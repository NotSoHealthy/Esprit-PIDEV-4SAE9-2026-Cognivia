package com.esprit.microservice.surveillanceandequipment.Repositories;

import com.esprit.microservice.surveillanceandequipment.Entities.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
}
