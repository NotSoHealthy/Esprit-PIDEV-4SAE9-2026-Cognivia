package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import com.esprit.microservice.surveillanceandequipment.Entities.MaintenanceStatus;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.MaintenanceRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.ReservationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

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
        List<Maintenance> maintenances =
                maintenanceRepository.findByEquipmentId(equipmentId);

        LocalDateTime now = LocalDateTime.now();
        List<Maintenance> toUpdate = new ArrayList<>();

        for (Maintenance maintenance : maintenances) {

            if (maintenance.getStatus() == MaintenanceStatus.SCHEDULED || maintenance.getStatus() == MaintenanceStatus.IN_PROGRESS) {
                if (!maintenance.getMaintenanceCompletionTime().isAfter(now)) {
                    maintenance.setStatus(MaintenanceStatus.COMPLETED);
                    toUpdate.add(maintenance);
                }

                else if (!maintenance.getMaintenanceTime().isAfter(now) &&
                        !maintenance.getMaintenanceCompletionTime().isBefore(now)) {

                    maintenance.setStatus(MaintenanceStatus.IN_PROGRESS);
                    toUpdate.add(maintenance);
                }
            }
        }

        if (!toUpdate.isEmpty()) {
            maintenanceRepository.saveAll(toUpdate);
        }

        return maintenances;
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

    public Optional<Maintenance> checkAvailability(Long equipmentId,
                                                   LocalDateTime start,
                                                   LocalDateTime end) {

        List<Maintenance> maintenances =
                maintenanceRepository.findByEquipmentId(equipmentId);

        return maintenances.stream()
                .filter(m -> m.getMaintenanceTime().isBefore(end) && m.getMaintenanceCompletionTime().isAfter(start))
                .min(Comparator.comparing(m -> Math.abs(m.getMaintenanceTime().until(start, java.time.temporal.ChronoUnit.MINUTES))));
    }
    public Optional<Maintenance> getClosestMaintenance(Long equipmentId) {

        List<Maintenance> maintenances = maintenanceRepository.findByEquipmentId(equipmentId);
        if (maintenances.isEmpty()) {
            return Optional.empty();
        }
        LocalDateTime now = LocalDateTime.now();
        return maintenances.stream()
                .min(Comparator.comparing(m ->
                        Math.abs(ChronoUnit.SECONDS.between(m.getMaintenanceTime(), now))
                ));
    }
}
