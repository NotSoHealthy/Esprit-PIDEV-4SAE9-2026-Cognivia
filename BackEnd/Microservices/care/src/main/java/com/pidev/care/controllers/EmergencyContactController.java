package com.pidev.care.controllers;

import com.pidev.care.entities.EmergencyContact;
import com.pidev.care.services.EmergencyContactService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/emergencycontact")
@AllArgsConstructor
public class EmergencyContactController {
    private final EmergencyContactService emergencyContactService;

    @GetMapping
    public List<EmergencyContact> getAllEmergencyContacts() {
        return emergencyContactService.getAll();
    }

    @GetMapping("/{id}")
    public EmergencyContact getEmergencyContactById(@PathVariable Long id) {
        return emergencyContactService.getById(id);
    }

    @PostMapping
    public EmergencyContact createEmergencyContact(@RequestBody EmergencyContact emergencyContact) {
        return emergencyContactService.create(emergencyContact);
    }

    @PutMapping("/{id}")
    public EmergencyContact updateEmergencyContact(@PathVariable Long id, @RequestBody EmergencyContact emergencyContact) {
        return emergencyContactService.update(id, emergencyContact);
    }

    @DeleteMapping("/{id}")
    public void deleteEmergencyContact(@PathVariable Long id) {
        emergencyContactService.delete(id);
    }
}
