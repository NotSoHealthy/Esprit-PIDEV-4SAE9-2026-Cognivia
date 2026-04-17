package org.example.forumservice.services;

import org.example.forumservice.openFeign.CareClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserLookupServiceTest {

    @Mock
    private CareClient careClient;

    @InjectMocks
    private UserLookupService userLookupService;

    private UUID testUuid;

    @BeforeEach
    void setUp() {
        testUuid = UUID.randomUUID();
    }

    // ─── null / blank guard ──────────────────────────────────────────────────

    @Test
    void lookupUser_nullUserId_returnsEmpty() {
        assertTrue(userLookupService.lookupUser(null).isEmpty());
        verifyNoInteractions(careClient);
    }

    @Test
    void lookupUser_blankUserId_returnsEmpty() {
        assertTrue(userLookupService.lookupUser("   ").isEmpty());
        verifyNoInteractions(careClient);
    }

    // ─── invalid UUID ────────────────────────────────────────────────────────

    @Test
    void lookupUser_invalidUuid_returnsEmpty() {
        Optional<UserLookupService.UserProfile> result = userLookupService.lookupUser("not-a-uuid");
        assertTrue(result.isEmpty());
    }

    // ─── Doctor happy path ───────────────────────────────────────────────────

    @Test
    void lookupUser_doctorFound_returnsProfileWithRoleDoctor() {
        String doctorJson = """
                {
                  "firstName": "Alice",
                  "lastName":  "Smith"
                }
                """;
        when(careClient.getDoctorByUserId(any(UUID.class))).thenReturn(doctorJson);

        Optional<UserLookupService.UserProfile> result = userLookupService.lookupUser(testUuid.toString());

        assertTrue(result.isPresent());
        assertEquals("Alice Smith", result.get().getFullName());
        assertEquals("Doctor", result.get().getRole());
        // Should NOT have tried Caregiver or Patient
        verify(careClient, never()).getCaregiverByUserId(any());
        verify(careClient, never()).getPatientByUserId(any());
    }

    // ─── Caregiver happy path ────────────────────────────────────────────────

    @Test
    void lookupUser_caregiverFound_returnsProfileWithRoleCaregiver() {
        String caregiverJson = """
                {
                  "firstName": "Bob",
                  "lastName":  "Jones"
                }
                """;
        // Doctor lookup returns null/blank → fall through to Caregiver
        when(careClient.getDoctorByUserId(any(UUID.class))).thenReturn("");
        when(careClient.getCaregiverByUserId(any(UUID.class))).thenReturn(caregiverJson);

        Optional<UserLookupService.UserProfile> result = userLookupService.lookupUser(testUuid.toString());

        assertTrue(result.isPresent());
        assertEquals("Bob Jones", result.get().getFullName());
        assertEquals("Caregiver", result.get().getRole());
    }

    // ─── Patient happy path ──────────────────────────────────────────────────

    @Test
    void lookupUser_patientFound_returnsProfileWithRolePatient() {
        String patientJson = """
                {
                  "firstName": "Carol",
                  "last_name": "White"
                }
                """;
        when(careClient.getDoctorByUserId(any(UUID.class))).thenReturn(null);
        when(careClient.getCaregiverByUserId(any(UUID.class))).thenReturn(null);
        when(careClient.getPatientByUserId(any(UUID.class))).thenReturn(patientJson);

        Optional<UserLookupService.UserProfile> result = userLookupService.lookupUser(testUuid.toString());

        assertTrue(result.isPresent());
        assertEquals("Carol White", result.get().getFullName());
        assertEquals("Patient", result.get().getRole());
    }

    // ─── Feign failure ───────────────────────────────────────────────────────

    @Test
    void lookupUser_allLookupsFail_returnsEmpty() {
        when(careClient.getDoctorByUserId(any())).thenThrow(new RuntimeException("service down"));
        when(careClient.getCaregiverByUserId(any())).thenThrow(new RuntimeException("service down"));
        when(careClient.getPatientByUserId(any())).thenThrow(new RuntimeException("service down"));

        Optional<UserLookupService.UserProfile> result = userLookupService.lookupUser(testUuid.toString());

        assertTrue(result.isEmpty()); // graceful fallback, no exception propagated
    }

    // ─── Caching ─────────────────────────────────────────────────────────────

    @Test
    void lookupUser_sameIdCalledTwice_onlyHitsCareServiceOnce() {
        String doctorJson = "{\"firstName\": \"Eve\", \"lastName\": \"Brown\"}";
        when(careClient.getDoctorByUserId(any(UUID.class))).thenReturn(doctorJson);

        String userId = testUuid.toString();
        userLookupService.lookupUser(userId);
        userLookupService.lookupUser(userId); // second call should hit cache

        // CareClient should only be invoked once
        verify(careClient, times(1)).getDoctorByUserId(any(UUID.class));
    }
}
