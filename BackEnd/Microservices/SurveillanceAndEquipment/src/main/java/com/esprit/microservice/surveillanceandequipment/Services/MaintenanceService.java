package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.MaintenanceRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.ReservationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class MaintenanceService {
    private final EquipmentRepository equipmentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final ReservationRepository reservationRepository;

    public Maintenance createMaintenance(Maintenance maintenance) {
            return maintenanceRepository.save(maintenance);
        }
    public Maintenance getMaintenanceById(Long id) {
        return maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance not found with id: " + id));
    }
    public List<Maintenance> getMaintenancesByEquipmentId(Long equipmentId) {
        return maintenanceRepository.findByEquipmentId(equipmentId);
    }

    public List<Maintenance> getAllMaintenances() {
        return maintenanceRepository.findAll();
    }

    public Maintenance updateMaintenance(Maintenance maintenance) {
        return maintenanceRepository.save(maintenance);
    }

    public void deleteMaintenance(Long id) {
        maintenanceRepository.deleteById(id);
    }

}
