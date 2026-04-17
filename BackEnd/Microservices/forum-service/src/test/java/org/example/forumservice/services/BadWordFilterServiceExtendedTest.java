package org.example.forumservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BadWordFilterServiceExtendedTest {

    private BadWordFilterService service;

    @BeforeEach
    void setUp() {
        service = new BadWordFilterService();
    }

    @Test
    void validateText_cleanText_doesNotThrow() {
        assertDoesNotThrow(() -> service.validateText("This is a helpful post about caregiving."));
    }

    @Test
    void validateText_nullInput_doesNotThrow() {
        assertDoesNotThrow(() -> service.validateText(null));
    }

    @Test
    void validateText_blankInput_doesNotThrow() {
        assertDoesNotThrow(() -> service.validateText("   "));
    }

    @Test
    void validateText_bannedWordUpperCase_throwsException() {
        // Case-insensitive: "IDIOT" should still be caught
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.validateText("You are an IDIOT"));
        assertTrue(ex.getMessage().toLowerCase().contains("idiot"));
    }

    @Test
    void validateText_bannedWordMixedCase_throwsException() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> service.validateText("What a Stupid thing to say"));
        assertTrue(ex.getMessage().toLowerCase().contains("stupid"));
    }

    @Test
    void validateText_bannedWordInSentence_throwsException() {
        assertThrows(RuntimeException.class,
                () -> service.validateText("I think you are a complete loser and should leave."));
    }

    @Test
    void validateText_wordThatContainsBannedSubstring_doesNotThrow() {
        // "classic" contains "ass" but whole-word matching should NOT flag it
        // "Scummy" contains "scum" — but "scum" IS a whole word match trigger, so
        // we use a safe word: "assessment" vs the word "ass" (not in the list anyway).
        // "lame" IS in the list, but "reclaimed" should NOT match as a whole word.
        assertDoesNotThrow(() -> service.validateText("The reclaimed wood looks fantastic."));
    }

    @Test
    void validateText_multiWordPhrase_caught() {
        // "shut up" is a banned phrase
        assertThrows(RuntimeException.class,
                () -> service.validateText("Please just shut up already."));
    }

    @Test
    void validateText_violenceTerm_throwsException() {
        assertThrows(RuntimeException.class,
                () -> service.validateText("I want to destroy everything."));
    }

    @Test
    void validateText_hateTerm_throwsException() {
        assertThrows(RuntimeException.class,
                () -> service.validateText("That person is a bigot."));
    }

    @Test
    void validateText_selfHarmTerm_throwsException() {
        assertThrows(RuntimeException.class,
                () -> service.validateText("He talked about self-harm."));
    }

    @Test
    void validateText_longCleanText_doesNotThrow() {
        String longText = "Caregiving for a loved one with Alzheimer's is challenging. "
                + "Make sure to get support from your community and maintain daily routines. "
                + "Consult your neurologist for medication guidance and monitoring of symptoms.";
        assertDoesNotThrow(() -> service.validateText(longText));
    }
}
