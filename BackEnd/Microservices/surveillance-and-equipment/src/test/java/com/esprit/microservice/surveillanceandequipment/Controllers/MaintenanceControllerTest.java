package com.esprit.microservice.surveillanceandequipment.Controllers;

import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import com.esprit.microservice.surveillanceandequipment.Entities.MaintenanceStatus;
import com.esprit.microservice.surveillanceandequipment.Services.MaintenanceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MaintenanceControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private MaintenanceService maintenanceService;

    @InjectMocks
    private MaintenanceController maintenanceController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(maintenanceController).build();
    }

    @Test
    void getMaintenanceById_shouldReturnMaintenance() throws Exception {
        Maintenance maintenance = new Maintenance();
        maintenance.setId(10L);
        maintenance.setStatus(MaintenanceStatus.SCHEDULED);

        when(maintenanceService.getMaintenanceById(10L)).thenReturn(maintenance);

        mockMvc.perform(get("/maintenance/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    void createMaintenance_shouldReturnSavedMaintenance() throws Exception {
        Maintenance request = new Maintenance();
        request.setDescription("motor fix");

        Maintenance saved = new Maintenance();
        saved.setId(11L);
        saved.setDescription("motor fix");

        when(maintenanceService.createMaintenance(any(Maintenance.class))).thenReturn(saved);

        mockMvc.perform(post("/maintenance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.description").value("motor fix"));
    }

    @Test
    void checkAvailability_shouldParseDateParamsAndReturnResult() throws Exception {
        String start = "2026-04-16T08:00:00";
        String end = "2026-04-16T09:00:00";

        Maintenance overlap = new Maintenance();
        overlap.setId(44L);

        when(maintenanceService.checkAvailability(eq(9L), eq(LocalDateTime.parse(start)), eq(LocalDateTime.parse(end))))
                .thenReturn(Optional.of(overlap));

        mockMvc.perform(get("/maintenance/checkavail")
                        .param("equipmentId", "9")
                        .param("start", start)
                        .param("end", end))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(44));

        verify(maintenanceService).checkAvailability(9L, LocalDateTime.parse(start), LocalDateTime.parse(end));
    }
}
