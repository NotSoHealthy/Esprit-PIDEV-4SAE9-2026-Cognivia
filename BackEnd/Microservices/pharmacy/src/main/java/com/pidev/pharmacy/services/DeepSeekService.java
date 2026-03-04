package com.pidev.pharmacy.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.pharmacy.entities.AgentActionType;
import com.pidev.pharmacy.entities.AgentMessage;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationStatus;
import com.pidev.pharmacy.entities.TherapeuticClass;
import com.pidev.pharmacy.repositories.MedicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DeepSeekService {

    private final RestTemplate restTemplate;
    private final MedicationRepository medicationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${deepseek.api.base-url:https://api.deepseek.com/chat/completions}")
    private String deepSeekBaseUrl;

    @Value("${deepseek.api.model:deepseek-chat}")
    private String deepSeekModel;

    @Value("${deepseek.api.key:}")
    private String deepSeekApiKey;

    @Transactional(readOnly = true)
    public Map<String, Object> giveMedicationAiOverview(Long medicationId) {
        Medication medication = getMedicationOrThrow(medicationId);
        String prompt = "Use FDA.gov, DailyMed, MedlinePlus, PubMed, DrugBank. Return compact JSON: {summary,indications,sideEffects,contraindications,source}. Med: "
                + medication.getName();
        String content = askDeepSeek("Medication expert. Use only: FDA.gov, DailyMed, MedlinePlus, PubMed, DrugBank. JSON.", prompt);
        return parseJsonOrFallback(content);
    }

    /**
     * Progressive medication validation - returns on FIRST issue found.
     * Sequential checks:
     * 1. Is medication name real/valid?
     * 2. Is it relevant to Alzheimer's disease?
     * 3. Does it already exist in database (exact or similar)?
     * 4. Is description accurate?
     * 5. Is therapeutic class correct?
     */
    @Transactional(readOnly = true)
    public AgentMessage validateMedicationComprehensive(Medication medication) {
        AgentMessage message = new AgentMessage();
        message.setMedication(medication);

        // Get all ACCEPTED medications for the AI to compare against
        List<Medication> acceptedMedications = medicationRepository.findAll()
                .stream()
                .filter(m -> m.getMedicationStatus() == MedicationStatus.ACCEPTED)
                .toList();
        String medicationList = acceptedMedications.stream()
                .map(m -> m.getName())
                .distinct()
                .reduce((a, b) -> a + ", " + b)
                .orElse("(no accepted medications in database)");

        String systemPrompt = "You are a pharmaceutical expert. Validate medication for Alzheimer's disease management. " +
                "Use FDA.gov, DailyMed, MedlinePlus, PubMed for accuracy. Respond ONLY with valid JSON, no markdown, no explanation.";

        // STEP 1: Check if medication name is real and valid
        {
            String userPrompt = String.format(
                    "Is '%s' a real, recognized medication name? Use FDA/DailyMed/DrugBank. " +
                    "Return JSON: {isReal, isCommonName, reason}",
                    medication.getName()
            );
            String aiResponse = askDeepSeek(systemPrompt, userPrompt);
            Map<String, Object> validation = parseJsonOrFallback(aiResponse);
            message.setRawAnalysisData("STEP 1 - Name Validation:\n" + aiResponse + "\n");

            boolean isReal = extractBoolean(validation, "isReal", true);
            if (!isReal) {
                message.setContent("⚠️ '" + medication.getName() + "' does not appear to be a real/recognized medication.");
                message.setActionType(AgentActionType.REVIEW_REQUIRED);
                return message;
            }
        }

        // STEP 2: Check Alzheimer's relevance
        {
            String userPrompt = String.format(
                    "Is '%s' relevant to Alzheimer's disease treatment/management? Use FDA/DailyMed/MedlinePlus. " +
                    "Return JSON: {isRelevant, reason}",
                    medication.getName()
            );
            String aiResponse = askDeepSeek(systemPrompt, userPrompt);
            Map<String, Object> validation = parseJsonOrFallback(aiResponse);
            message.setRawAnalysisData(message.getRawAnalysisData() + "\nSTEP 2 - Alzheimer's Relevance:\n" + aiResponse + "\n");

            boolean isRelevant = extractBoolean(validation, "isRelevant", true);
            if (!isRelevant) {
                String reason = extractString(validation, "reason", "");
                message.setContent("⚠️ Medication is not relevant to Alzheimer's disease management.\nReason: " + reason);
                message.setActionType(AgentActionType.REVIEW_REQUIRED);
                return message;
            }
        }

        // STEP 3: Check for exact or similar names in database (ACCEPTED medications only)
        {
            String userPrompt = String.format(
                    "Given the medication name '%s', check if it matches or is similar to any of these existing ACCEPTED medications : %s." +
                    "Consider abbreviations" +
                    "The objective is to check for conflicts within the database before adding a new medicaiton do not check if this is a real life medication"+
                    "Return JSON: {exists, matchedName, reason}",
                    medication.getName(),
                    medicationList
            );
            String aiResponse = askDeepSeek(systemPrompt, userPrompt);
            Map<String, Object> validation = parseJsonOrFallback(aiResponse);

            System.out.println("===== DEEPSEEK RAW RESPONSE =====");
            System.out.println(aiResponse);
            System.out.println("=================================");

            message.setRawAnalysisData(message.getRawAnalysisData() + "\nSTEP 3 - Name Conflict Check:\n" + aiResponse + "\n");

            boolean exists = extractBoolean(validation, "exists", false);
            if (exists) {
                String matchedName = extractString(validation, "matchedName", medication.getName());
                message.setContent("⚠️ Medication already exists in database as '" + matchedName + "'.");
                message.setActionType(AgentActionType.DELETE);
                return message;
            }
        }

        // STEP 4 & 5: Check description accuracy AND therapeutic class correctness (combined)
        {
            // Combined validation to check both fields at once
            String userPrompt = String.format(
                    "Validate medication '%s' on two aspects:\n" +
                    "1. Is the description accurate? Description: '%s'\n" +
                    "2. Is the therapeutic class correct? Class: '%s'\n\n" +
                    "For the therapeutic class, ONLY use one of these exact values:\n" +
                    "- CHOLINESTERASE_INHIBITOR\n" +
                    "- NMDA_RECEPTOR_ANTAGONIST\n" +
                    "- ANTI_AMYLOID_MONOCLONAL_ANTIBODY\n" +
                    "- COMBINATION_PRODUCT\n\n" +
                    "Use FDA/DailyMed. Return JSON: {descriptionAccurate, suggestedDescription, descriptionReason, classCorrect, suggestedClass, classReason}",
                    medication.getName(),
                    nullSafe(medication.getDescription()),
                    medication.getTherapeuticClass()
            );
            String aiResponse = askDeepSeek(systemPrompt, userPrompt);
            Map<String, Object> validation = parseJsonOrFallback(aiResponse);
            message.setRawAnalysisData(message.getRawAnalysisData() + "\nSTEP 4 & 5 - Description & Class Check:\n" + aiResponse + "\n");

            boolean descriptionAccurate = extractBoolean(validation, "descriptionAccurate", true);
            boolean classCorrect = extractBoolean(validation, "classCorrect", true);

            // If either or both need correction, collect all issues
            if (!descriptionAccurate || !classCorrect) {
                List<String> issues = new ArrayList<>();
                
                if (!descriptionAccurate) {
                    String suggested = extractString(validation, "suggestedDescription", null);
                    String reason = extractString(validation, "descriptionReason", "");
                    String content = "📝 Description needs correction.";
                    if (!reason.isEmpty()) content += " Reason: " + reason;
                    if (suggested != null) content += " | Suggested: " + suggested;
                    issues.add(content);
                }
                
                if (!classCorrect) {
                    String suggested = extractString(validation, "suggestedClass", null);
                    String reason = extractString(validation, "classReason", "");
                    String content = "🏷️ Therapeutic class needs correction.";
                    if (!reason.isEmpty()) content += " Reason: " + reason;
                    if (suggested != null) content += " | Suggested: " + suggested;
                    issues.add(content);
                }
                
                message.setContent(String.join("\n\n", issues));
                message.setActionType(AgentActionType.PATCH_AND_ACCEPT);
                return message;
            }
        }

        // All checks passed
        message.setContent("✅ Medication passed all validations. Ready for acceptance.");
        message.setActionType(AgentActionType.ACCEPT);
        return message;
    }

    @Transactional
    public Map<String, Object> autoModifyMedication(Long medicationId) {
        Medication medication = getMedicationOrThrow(medicationId);
        String prompt = "Med: " + medication.getName() + ", desc: " + nullSafe(medication.getDescription())
                + ", class: " + medication.getTherapeuticClass() + ". Use FDA/DailyMed/DrugBank. JSON: {name,description,therapeuticClass,medicationStatus,reason}";
        String ai = askDeepSeek("Correct med fields conservatively. JSON only.", prompt);

        Map<String, Object> parsed = parseJsonOrFallback(ai);
        applyMedicationPatch(medication, parsed);
        medicationRepository.save(medication);

        Map<String, Object> result = new HashMap<>();
        result.put("updated", true);
        result.put("medication", medication);
        result.put("aiPatch", parsed);
        return result;
    }

    @Transactional
    public Map<String, Object> autoDeleteMedication(Long medicationId) {
        Medication medication = getMedicationOrThrow(medicationId);
        String prompt = "Med: " + medication.getName() + ", class: " + medication.getTherapeuticClass()
                + ". Use FDA/DailyMed. JSON: {delete,reason,confidence}";
        Map<String, Object> parsed = parseJsonOrFallback(askDeepSeek("Delete from Alzheimer catalog? JSON only.", prompt));

        boolean delete = Boolean.TRUE.equals(parsed.get("delete"));
        if (delete) {
            medicationRepository.delete(medication);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("deleted", delete);
        result.put("decision", parsed);
        return result;
    }

    @Transactional
    public Map<String, Object> autoSuggestAndAddMedication(String context) {
        String prompt = "Suggest one Alzheimer-related medication and return JSON only: name, description, therapeuticClass, medicationStatus. Context: " + context;
        Map<String, Object> parsed = parseJsonOrFallback(askDeepSeek("You add valid Alzheimer medication records. JSON only.", prompt));

        Medication medication = new Medication();
        medication.setName(asText(parsed.get("name")));
        medication.setDescription(asText(parsed.get("description")));
        medication.setTherapeuticClass(parseTherapeuticClass(asText(parsed.get("therapeuticClass"))));
        medication.setMedicationStatus(parseMedicationStatus(asText(parsed.get("medicationStatus"))));

        if (medication.getName() == null || medication.getName().isBlank()) {
            throw new RuntimeException("AI suggestion did not include a valid medication name.");
        }

        Medication saved = medicationRepository.save(medication);
        Map<String, Object> result = new HashMap<>();
        result.put("added", true);
        result.put("medication", saved);
        result.put("aiSuggestion", parsed);
        return result;
    }


    private Medication getMedicationOrThrow(Long id) {
        return medicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medication not found with id: " + id));
    }

    private String askDeepSeek(String systemPrompt, String userPrompt) {
        if (deepSeekApiKey == null || deepSeekApiKey.isBlank()) {
            return "{\"error\":\"deepseek.api.key is not configured\"}";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(deepSeekApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("model", deepSeekModel);
            body.put("temperature", 0.1);
            body.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            String rawResponse = restTemplate.postForObject(deepSeekBaseUrl, request, String.class);
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("choices").path(0).path("message").path("content").asText("{}");
        } catch (Exception e) {
            return "{\"error\":\"DeepSeek call failed: " + e.getMessage().replace("\"", "'") + "\"}";
        }
    }

    private Map<String, Object> parseJsonOrFallback(String text) {
        try {
            JsonNode node = objectMapper.readTree(text);
            return objectMapper.convertValue(node, Map.class);
        } catch (Exception ignored) {
            return Map.of("raw", text);
        }
    }

    private void applyMedicationPatch(Medication medication, Map<String, Object> patch) {
        String newName = asText(patch.get("name"));
        if (newName != null && !newName.isBlank()) {
            medication.setName(newName);
        }

        String newDescription = asText(patch.get("description"));
        if (newDescription != null && !newDescription.isBlank()) {
            medication.setDescription(newDescription);
        }

        TherapeuticClass cls = parseTherapeuticClass(asText(patch.get("therapeuticClass")));
        if (cls != null) {
            medication.setTherapeuticClass(cls);
        }

        MedicationStatus status = parseMedicationStatus(asText(patch.get("medicationStatus")));
        if (status != null) {
            medication.setMedicationStatus(status);
        }
    }

    private TherapeuticClass parseTherapeuticClass(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return TherapeuticClass.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ignored) {
            return null;
        }
    }

    private MedicationStatus parseMedicationStatus(String value) {
        if (value == null || value.isBlank()) {
            return MedicationStatus.PENDING;
        }
        try {
            return MedicationStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ignored) {
            return MedicationStatus.PENDING;
        }
    }

    private String asText(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private boolean isSimilar(String a, String b, double threshold) {
        if (a == null || b == null) {
            return false;
        }
        String left = a.toLowerCase(Locale.ROOT).trim();
        String right = b.toLowerCase(Locale.ROOT).trim();
        int distance = levenshtein(left, right);
        int maxLen = Math.max(left.length(), right.length());
        if (maxLen == 0) {
            return true;
        }
        double similarity = 1.0 - (double) distance / maxLen;
        return similarity >= threshold;
    }

    private int levenshtein(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= b.length(); j++) {
            dp[0][j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[a.length()][b.length()];
    }

    private boolean extractBoolean(Map<String, Object> map, String key, boolean defaultValue) {
        if (map == null || !map.containsKey(key)) {
            return defaultValue;
        }
        Object value = map.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        if (value instanceof String) {
            String str = ((String) value).toLowerCase();
            return str.equals("true") || str.equals("yes");
        }
        return defaultValue;
    }

    private String extractString(Map<String, Object> map, String key, String defaultValue) {
        if (map == null || !map.containsKey(key)) {
            return defaultValue;
        }
        Object value = map.get(key);
        return value == null ? defaultValue : String.valueOf(value);
    }
}
