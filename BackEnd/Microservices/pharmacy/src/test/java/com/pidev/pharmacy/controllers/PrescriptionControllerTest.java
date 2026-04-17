package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.Prescription;
import com.pidev.pharmacy.services.PrescriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PrescriptionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PrescriptionService prescriptionService;

    @InjectMocks
    private PrescriptionController prescriptionController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(prescriptionController).build();
    }

    @Test
    void getVisiblePrescriptions_shouldReturnEmptyListWhenNoPatientNames() throws Exception {
        mockMvc.perform(get("/prescriptions/visible"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));

        verify(prescriptionService, never()).getVisibleByPatientNameMentions(any());
    }

    @Test
    void createPrescription_shouldReturnCreatedAndInjectHeaderValues() throws Exception {
        Prescription created = new Prescription();
        created.setId(9L);
        created.setDoctorName("doctorA");
        created.setPatientName("Patient Name");

        when(prescriptionService.create(any(Prescription.class))).thenReturn(created);

        String userId = UUID.randomUUID().toString();
        String payload = "{" +
                "\"patientName\":\"Patient Name\"," +
                "\"doctorName\":\"\"," +
                "\"description\":\"Take after meals\"," +
                "\"expiresAt\":\"" + Instant.now().plusSeconds(3600).toString() + "\"," +
                "\"items\":[]" +
                "}";

        mockMvc.perform(post("/prescriptions")
                        .header("X-User-Id", userId)
                        .header("X-Username", "doctorA")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(9));
    }

    @Test
    void updatePrescription_shouldReturnForbiddenWhenActorIsNotOwner() throws Exception {
        UUID owner = UUID.randomUUID();
        UUID actor = UUID.randomUUID();

        Prescription existing = new Prescription();
        existing.setId(1L);
        existing.setCreatedByDoctorUserId(owner);

        when(prescriptionService.getById(1L)).thenReturn(existing);

        String payload = "{" +
                "\"patientName\":\"Patient Name\"," +
                "\"description\":\"Take after meals\"," +
                "\"expiresAt\":\"" + Instant.now().plusSeconds(3600).toString() + "\"" +
                "}";

        mockMvc.perform(put("/prescriptions/1")
                        .header("X-User-Id", actor.toString())
                        .header("X-User-Role", "ROLE_DOCTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());

        verify(prescriptionService, never()).update(eq(1L), any(Prescription.class));
    }
}
