package com.esprit.microservice.surveillanceandequipment.Controllers;

import com.esprit.microservice.surveillanceandequipment.Entities.Equipment;
import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentStatus;
import com.esprit.microservice.surveillanceandequipment.Services.EquipmentService;
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

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EquipmentControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private EquipmentService equipmentService;

    @InjectMocks
    private EquipmentController equipmentController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(equipmentController).build();
    }

    @Test
    void getEquipmentById_shouldReturnEquipment() throws Exception {
        Equipment equipment = new Equipment();
        equipment.setId(5L);
        equipment.setName("ECG Monitor");

        when(equipmentService.getEquipmentById(5L)).thenReturn(equipment);

        mockMvc.perform(get("/equipment/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.name").value("ECG Monitor"));
    }

    @Test
    void updateEquipment_shouldReturnUpdatedEquipment() throws Exception {
        Equipment request = new Equipment();
        request.setId(9L);
        request.setName("Infusion Pump");

        Equipment updated = new Equipment();
        updated.setId(9L);
        updated.setName("Infusion Pump");
        updated.setStatus(EquipmentStatus.AVAILABLE);

        when(equipmentService.updateEquipment(any(Equipment.class))).thenReturn(updated);

        mockMvc.perform(put("/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(9))
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
    }

    @Test
    void extractEquipmentFromText_shouldDelegateToService() throws Exception {
        Equipment extracted = new Equipment();
        extracted.setName("Ultrasound");
        extracted.setConditionScore(88);

        when(equipmentService.buildEquipmentFromText(eq("OCR text"))).thenReturn(extracted);

        mockMvc.perform(post("/equipment/extract-from-text")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("text", "OCR text"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ultrasound"))
                .andExpect(jsonPath("$.conditionScore").value(88));

        verify(equipmentService).buildEquipmentFromText("OCR text");
    }
}
