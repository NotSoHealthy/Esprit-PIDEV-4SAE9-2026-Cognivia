package org.example.forumservice.services;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    private static final Map<String, Set<String>> CATEGORY_MAP = new LinkedHashMap<>();
    private static final Set<String> ALL_KEYWORDS;

    static {
        CATEGORY_MAP.put("Research & Clinical", new HashSet<>(Arrays.asList(
                "clinical", "research", "biopsy", "biomarker", "imaging", "mri", "ct scan", "clinical trials",
                "amyloid", "tau", "plaque", "study", "trial", "lab", "scientist", "scientific")));

        CATEGORY_MAP.put("Care & Support", new HashSet<>(Arrays.asList(
                "caregiver", "support", "community", "therapy", "patient", "health", "daily living", "aging",
                "assisted living", "home care", "routine", "lifestyle", "strategy", "help", "care", "family")));

        CATEGORY_MAP.put("Medication", new HashSet<>(Arrays.asList(
                "treatment", "aricept", "donepezil", "memantine", "namenda", "rivastigmine", "galantamine",
                "prescription", "medication", "drug", "pill", "medicine", "dosage")));

        CATEGORY_MAP.put("Symptoms & Diagnosis", new HashSet<>(Arrays.asList(
                "memory", "cognitive", "dementia", "alzheimer", "alzheimers", "neurologist", "diagnosis",
                "forgetfulness", "disorientation", "signs", "disorder", "symptom", "symptoms", "mood", "behavior")));

        CATEGORY_MAP.put("Neurology", new HashSet<>(Arrays.asList(
                "brain", "neuron", "hippocampus", "synapse", "neurotransmitter", "acetylcholine", "glutamate",
                "neurodegeneration", "neurological", "nervous", "science")));

        ALL_KEYWORDS = CATEGORY_MAP.values().stream()
                .flatMap(Set::stream)
                .collect(Collectors.toSet());
    }

    public List<String> extractKeywords(String text) {
        if (text == null || text.isEmpty()) {
            return Collections.emptyList();
        }

        // Replace non-alphabetic characters with space to prevent sticking words
        // together (e.g., Alzheimer's -> alzheimer s)
        String normalized = text.toLowerCase().replaceAll("[^a-z\\s]", " ");
        String[] words = normalized.split("\\s+");

        return Arrays.stream(words)
                .filter(ALL_KEYWORDS::contains)
                .distinct()
                .collect(Collectors.toList());
    }

    public String determineCategory(List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) {
            return "General";
        }

        Map<String, Integer> categoryWeights = new HashMap<>();
        for (String keyword : keywords) {
            for (Map.Entry<String, Set<String>> entry : CATEGORY_MAP.entrySet()) {
                if (entry.getValue().contains(keyword)) {
                    categoryWeights.put(entry.getKey(), categoryWeights.getOrDefault(entry.getKey(), 0) + 1);
                }
            }
        }

        return categoryWeights.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("General");
    }
}
