package com.esprit.microservice.surveillanceandequipment.Controllers;
import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;

import com.esprit.microservice.surveillanceandequipment.Services.MaintenanceService;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/maintenance")
@AllArgsConstructor
public class MaintenanceController {
    private final MaintenanceService maintenanceService;

    @GetMapping
    public List<Maintenance> getAllMaintenances() {
        return maintenanceService.getAllMaintenances();
    }

    @GetMapping("/{id}")
    public Maintenance getMaintenanceById(@PathVariable Long id) {
        return maintenanceService.getMaintenanceById(id);
    }

    @GetMapping("/equipment/{equipmentId}")
    public List<Maintenance> getMaintenancesByEquipmentId(@PathVariable Long equipmentId) {
        return maintenanceService.getMaintenancesByEquipmentId(equipmentId);
    }

    @PostMapping
    public Maintenance createMaintenance(@RequestBody Maintenance maintenance) {
        return maintenanceService.createMaintenance(maintenance);
    }

    @PutMapping("/{id}")
    public Maintenance updateMaintenance(@RequestBody Maintenance maintenance) {
        return maintenanceService.updateMaintenance(maintenance);
    }

    @DeleteMapping("/{id}")
    public void deleteMaintenance(@PathVariable Long id) {
        maintenanceService.deleteMaintenance(id);
    }

    @GetMapping("/checkavail")
    public Optional<Maintenance> checkAvailability(
            @RequestParam Long equipmentId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end) {

        return maintenanceService.checkAvailability(equipmentId, start, end);
    }
    @GetMapping("/closest/{equipmentId}")
    public Optional<Maintenance> getClosestMaintenance(@PathVariable Long equipmentId) {
        return maintenanceService.getClosestMaintenance(equipmentId);
    }
}
