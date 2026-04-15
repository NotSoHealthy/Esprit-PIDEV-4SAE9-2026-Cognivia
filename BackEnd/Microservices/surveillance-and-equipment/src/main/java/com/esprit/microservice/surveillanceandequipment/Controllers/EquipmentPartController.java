package com.esprit.microservice.surveillanceandequipment.Controllers;

import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentPart;
import com.esprit.microservice.surveillanceandequipment.Services.EquipmentPartService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/equipment-parts")
@RequiredArgsConstructor
public class EquipmentPartController {

    private final EquipmentPartService service;

    @PostMapping
    public EquipmentPart create(@RequestBody EquipmentPart part) {
        return service.save(part);
    }

    @GetMapping("/{equipmentId}")
    public List<EquipmentPart> getParts(@PathVariable Long equipmentId) {
        return service.getByEquipment(equipmentId);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @PutMapping
    public EquipmentPart update(@RequestBody EquipmentPart part) {
        return service.update(part);
    }
}
