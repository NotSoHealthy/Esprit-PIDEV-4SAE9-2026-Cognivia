package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Controllers.DeepseekClient;
import com.esprit.microservice.surveillanceandequipment.Entities.Equipment;
import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentStatus;
import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import com.esprit.microservice.surveillanceandequipment.Entities.Reservation;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.MaintenanceRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.ReservationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final DeepseekClient deepseekClient;
    private final ObjectMapper objectMapper;
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

    public Equipment buildEquipmentFromText(String extractedText) {

        String systemPrompt = """
        You are an information extraction system.

        Your task is to extract structured equipment information from raw text.

        Rules:
        - Always return a VALID JSON object (no explanations, no text outside JSON).
        - If a field is missing, return null.
        - Do not hallucinate values. Only extract what is present or clearly implied.
        - Keep values concise and clean.
        - Do not include extra fields.

        Expected JSON format:
        {
          "name": string,
          "description": string,
          "conditionScore": number
        }

        Field guidelines:
        - "name": The main name or title of the equipment.
        - "description": A short and clear summary of what the equipment does.
        - "conditionScore": An integer between 0 and 100 representing the condition:
            - 90-100: new/excellent
            - 70-89: good
            - 50-69: average
            - 0-49: poor
          If not mentioned, return 80.

        Important:
        - Return ONLY JSON.
        """;

        String userPrompt = "Extract equipment information from the following text:\n" + extractedText;

        String response = deepseekClient.askDeepSeek(systemPrompt, userPrompt);
        System.out.println("Raw AI response: " + response);

        // 🔥 Clean response (handle ```json)
        response = response.replace("```json", "")
                .replace("```", "")
                .trim();
        System.out.println("Cleaned AI response: " + response);

        try {
            JsonNode json = objectMapper.readTree(response);
            System.out.println("Parsed JSON from AI response: " + json);
            Equipment equipment = new Equipment();

            equipment.setName(getText(json, "name"));
            equipment.setDescription(getText(json, "description"));

            // conditionScore with fallback
            int conditionScore = getInt(json, "conditionScore", 80);
            equipment.setConditionScore(conditionScore);

            // 🔥 force default status
            equipment.setStatus(EquipmentStatus.AVAILABLE);
            System.out.println("Extracted equipment: " + equipment);

            return equipment;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse AI response: " + response, e);
        }
    }

    // helpers

    private String getText(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull()
                ? node.get(field).asText()
                : null;
    }

    private int getInt(JsonNode node, String field, int defaultValue) {
        return node.has(field) && node.get(field).isInt()
                ? node.get(field).asInt()
                : defaultValue;
    }
}
