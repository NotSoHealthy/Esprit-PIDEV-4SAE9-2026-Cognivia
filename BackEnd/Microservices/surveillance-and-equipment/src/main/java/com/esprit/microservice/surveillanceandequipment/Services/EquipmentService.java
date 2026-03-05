package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Equipment;
import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentStatus;
import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import com.esprit.microservice.surveillanceandequipment.Entities.Reservation;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.MaintenanceRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.ReservationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
public class EquipmentService {
    private final EquipmentRepository equipmentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final ReservationRepository reservationRepository;
    public Equipment createEquipment(Equipment equipment) {
        return equipmentRepository.save(equipment);
    }

    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
    }

    public List<Equipment> getAllEquipment() {

        List<Equipment> equipments = equipmentRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Equipment equipment : equipments) {

            Long equipmentId = equipment.getId();

            List<Maintenance> activeMaintenances =
                    maintenanceRepository
                            .findByEquipmentIdAndMaintenanceTimeLessThanEqualAndMaintenanceCompletionTimeGreaterThanEqual(
                                    equipmentId,
                                    now,
                                    now
                            );

            boolean hasActiveMaintenance = !activeMaintenances.isEmpty();

            List<Reservation> activeReservations =
                    reservationRepository
                            .findByEquipmentIdAndReservationDateLessThanEqualAndReturnDateGreaterThanEqual(
                                    equipmentId,
                                    now,
                                    now
                            );

            boolean hasActiveReservation = !activeReservations.isEmpty();

            if (hasActiveMaintenance) {

                if (equipment.getStatus() != EquipmentStatus.MAINTENANCE) {
                    equipment.setStatus(EquipmentStatus.MAINTENANCE);
                    equipmentRepository.save(equipment);
                }
            }


            else if (hasActiveReservation) {

                if (equipment.getStatus() != EquipmentStatus.RESERVED) {
                    equipment.setStatus(EquipmentStatus.RESERVED);
                    equipmentRepository.save(equipment);
                }
            }


            else {

                if (equipment.getStatus() != EquipmentStatus.AVAILABLE) {
                    equipment.setStatus(EquipmentStatus.AVAILABLE);
                    equipmentRepository.save(equipment);
                }
            }
        }

        return equipments;
    }

    public Equipment updateEquipment(Equipment equipment) {
        System.out.println("Updating equipment: " + equipment);
        return equipmentRepository.save(equipment);
    }

    public void deleteEquipment(Long id) {
        equipmentRepository.deleteById(id);
    }
}
