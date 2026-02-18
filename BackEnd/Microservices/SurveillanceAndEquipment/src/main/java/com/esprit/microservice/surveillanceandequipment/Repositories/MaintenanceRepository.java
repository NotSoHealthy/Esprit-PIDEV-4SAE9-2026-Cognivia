package com.esprit.microservice.surveillanceandequipment.Repositories;

import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
}
