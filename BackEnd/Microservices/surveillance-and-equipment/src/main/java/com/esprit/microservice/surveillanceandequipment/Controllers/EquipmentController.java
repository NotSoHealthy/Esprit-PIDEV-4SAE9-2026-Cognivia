package com.esprit.microservice.surveillanceandequipment.Controllers;

import com.esprit.microservice.surveillanceandequipment.Entities.Equipment;
import com.esprit.microservice.surveillanceandequipment.Services.EquipmentService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/equipment")
@AllArgsConstructor
public class EquipmentController {
    private final EquipmentService equipmentService;

    @GetMapping
    public List<Equipment> getAllEquipments() {
        return equipmentService.getAllEquipment();
    }

    @GetMapping("/{id}")
    public Equipment getEquipmentById(@PathVariable Long id) {
        return equipmentService.getEquipmentById(id);
    }

    @PostMapping
    public Equipment createEquipment(@RequestBody Equipment equipment) {
        return equipmentService.createEquipment(equipment);
    }

    @PutMapping
    public Equipment updateEquipment(@RequestBody Equipment equipment) {
        return equipmentService.updateEquipment(equipment);
    }

    @DeleteMapping("/{id}")
    public void deleteEquipment(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
    }

    @PostMapping("/extract-from-text")
    public Equipment extractEquipmentFromText(@RequestBody Map<String, String> body) {
        return equipmentService.buildEquipmentFromText(body.get("text"));
    }
}
