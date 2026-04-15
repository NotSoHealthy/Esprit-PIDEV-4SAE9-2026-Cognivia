package org.example.forumservice.services;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class BadWordFilterServiceTest {

    private final BadWordFilterService filterService = new BadWordFilterService();

    @Test
    void testValidateText_CleanText() {
        assertDoesNotThrow(() -> filterService.validateText("This is a clean message about health."));
    }

    @Test
    void testValidateText_ContainsBadWord() {
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> filterService.validateText("You are an idiot and should leave."));
        assertTrue(exception.getMessage().contains("idiot"));
    }

    @Test
    void testValidateText_ContainsBadWordUpperCase() {
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> filterService.validateText("YOU ARE STUPID"));
        assertTrue(exception.getMessage().contains("stupid"));
    }

    @Test
    void testValidateText_ContainsBadWordSubstringsNotBlocked() {
        // "ass" is problematic but "assessment" should be fine (if word boundaries are used)
        assertDoesNotThrow(() -> filterService.validateText("The assessment was very thorough."));
    }

    @Test
    void testValidateText_NullOrEmpty() {
        assertDoesNotThrow(() -> filterService.validateText(null));
        assertDoesNotThrow(() -> filterService.validateText(""));
    }
}
