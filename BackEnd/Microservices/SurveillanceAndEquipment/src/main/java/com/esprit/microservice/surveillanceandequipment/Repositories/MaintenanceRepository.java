package com.esprit.microservice.surveillanceandequipment.Repositories;

import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
    List<Maintenance> findByEquipmentId(Long equipmentId);
}
