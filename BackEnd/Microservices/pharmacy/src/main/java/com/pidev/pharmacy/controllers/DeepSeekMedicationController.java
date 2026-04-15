package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.AgentMessage;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.repositories.MedicationRepository;
import com.pidev.pharmacy.services.DeepSeekService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ai/medications")
@AllArgsConstructor
public class DeepSeekMedicationController {

    private final DeepSeekService deepSeekService;
    private final MedicationRepository medicationRepository;

    @GetMapping("/{id}/overview")
    public Map<String, Object> giveMedicationAiOverview(@PathVariable Long id) {
        return deepSeekService.giveMedicationAiOverview(id);
    }

    @PostMapping("/{id}/validate")
    public AgentMessage validateMedication(@PathVariable Long id) {
        Medication medication = medicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + id));
        return deepSeekService.validateMedicationComprehensive(medication);
    }

    @PostMapping("/{id}/auto-modify")
    public Map<String, Object> autoModifyMedication(@PathVariable Long id) {
        return deepSeekService.autoModifyMedication(id);
    }

    @PostMapping("/{id}/auto-delete")
    public Map<String, Object> autoDeleteMedication(@PathVariable Long id) {
        return deepSeekService.autoDeleteMedication(id);
    }

    @PostMapping("/auto-suggest-add")
    public Map<String, Object> autoSuggestAndAddMedication(@RequestParam(defaultValue = "") String context) {
        return deepSeekService.autoSuggestAndAddMedication(context);
    }

    @GetMapping("/askDeepSeek")
    public String askDeepSeek(@RequestParam String systemPrompt, @RequestParam String userPrompt) {
        return deepSeekService.askDeepSeek(systemPrompt, userPrompt);
    }
}

