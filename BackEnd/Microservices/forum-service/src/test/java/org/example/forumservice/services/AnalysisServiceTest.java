package org.example.forumservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AnalysisServiceTest {

    private AnalysisService analysisService;

    @BeforeEach
    void setUp() {
        analysisService = new AnalysisService();
    }

    // ─── extractKeywords ────────────────────────────────────────────────────

    @Test
    void extractKeywords_knowWord_returnsIt() {
        List<String> keywords = analysisService.extractKeywords("My memory is getting worse");
        assertTrue(keywords.contains("memory"));
    }

    @Test
    void extractKeywords_unknownWord_ignored() {
        List<String> keywords = analysisService.extractKeywords("hello world xyz");
        assertTrue(keywords.isEmpty());
    }

    @Test
    void extractKeywords_nullInput_returnsEmpty() {
        assertTrue(analysisService.extractKeywords(null).isEmpty());
    }

    @Test
    void extractKeywords_emptyInput_returnsEmpty() {
        assertTrue(analysisService.extractKeywords("   ").isEmpty());
    }

    @Test
    void extractKeywords_duplicateWords_deduplicates() {
        List<String> keywords = analysisService.extractKeywords("memory memory memory");
        assertEquals(1, keywords.stream().filter("memory"::equals).count());
    }

    @Test
    void extractKeywords_stripsPunctuation() {
        // "Alzheimer's" → "alzheimer s" → "alzheimer" should match
        List<String> keywords = analysisService.extractKeywords("Alzheimer's disease");
        assertTrue(keywords.contains("alzheimer"));
    }

    @Test
    void extractKeywords_multipleCategories_extractsAll() {
        List<String> keywords = analysisService.extractKeywords("brain memory caregiver");
        assertTrue(keywords.contains("brain"));
        assertTrue(keywords.contains("memory"));
        assertTrue(keywords.contains("caregiver"));
    }

    // ─── determineCategory ──────────────────────────────────────────────────

    @Test
    void determineCategory_neurologyKeywords_returnsNeurology() {
        String category = analysisService.determineCategory(List.of("brain", "neuron", "synapse"));
        assertEquals("Neurology", category);
    }

    @Test
    void determineCategory_symptomsKeywords_returnsSymptomsAndDiagnosis() {
        String category = analysisService.determineCategory(List.of("memory", "dementia", "alzheimer"));
        assertEquals("Symptoms & Diagnosis", category);
    }

    @Test
    void determineCategory_medicationKeyword_returnsMedication() {
        String category = analysisService.determineCategory(List.of("medication", "dosage", "drug"));
        assertEquals("Medication", category);
    }

    @Test
    void determineCategory_careKeywords_returnsCareAndSupport() {
        String category = analysisService.determineCategory(List.of("caregiver", "support", "family"));
        assertEquals("Care & Support", category);
    }

    @Test
    void determineCategory_emptyList_returnsGeneral() {
        assertEquals("General", analysisService.determineCategory(List.of()));
    }

    @Test
    void determineCategory_nullList_returnsGeneral() {
        assertEquals("General", analysisService.determineCategory(null));
    }

    @Test
    void determineCategory_unknownKeywords_returnsGeneral() {
        assertEquals("General", analysisService.determineCategory(List.of("unknownword")));
    }

    @Test
    void determineCategory_tieBreaking_mostKeywordsWins() {
        // 2 neurology keywords vs 1 symptoms keyword
        String category = analysisService.determineCategory(List.of("brain", "neuron", "memory"));
        assertEquals("Neurology", category);
    }
}
