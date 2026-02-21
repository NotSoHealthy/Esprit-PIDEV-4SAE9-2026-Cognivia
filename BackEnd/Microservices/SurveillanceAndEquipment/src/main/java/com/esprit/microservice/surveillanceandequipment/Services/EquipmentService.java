package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Equipment;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.MaintenanceRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.ReservationRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

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
        return equipmentRepository.findAll();
    }

    public Equipment updateEquipment(Equipment equipment) {
        System.out.println("Updating equipment: " + equipment);
        return equipmentRepository.save(equipment);
    }

    public void deleteEquipment(Long id) {
        equipmentRepository.deleteById(id);
    }
}
