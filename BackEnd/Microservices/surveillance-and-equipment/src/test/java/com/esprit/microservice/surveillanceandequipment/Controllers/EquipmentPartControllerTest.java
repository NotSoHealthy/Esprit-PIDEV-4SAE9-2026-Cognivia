package com.esprit.microservice.surveillanceandequipment.Controllers;

import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentPart;
import com.esprit.microservice.surveillanceandequipment.Services.EquipmentPartService;
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

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EquipmentPartControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private EquipmentPartService equipmentPartService;

    @InjectMocks
    private EquipmentPartController equipmentPartController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(equipmentPartController).build();
    }

    @Test
    void create_shouldReturnSavedPart() throws Exception {
        EquipmentPart request = new EquipmentPart();
        request.setName("Screen");

        EquipmentPart saved = new EquipmentPart();
        saved.setId(3L);
        saved.setName("Screen");

        when(equipmentPartService.save(any(EquipmentPart.class))).thenReturn(saved);

        mockMvc.perform(post("/equipment-parts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("Screen"));
    }

    @Test
    void getParts_shouldReturnList() throws Exception {
        EquipmentPart part = new EquipmentPart();
        part.setId(4L);
        part.setEquipmentId(10L);

        when(equipmentPartService.getByEquipment(10L)).thenReturn(List.of(part));

        mockMvc.perform(get("/equipment-parts/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(4))
                .andExpect(jsonPath("$[0].equipmentId").value(10));
    }

    @Test
    void delete_shouldReturnOk() throws Exception {
        mockMvc.perform(delete("/equipment-parts/7"))
                .andExpect(status().isOk());

        verify(equipmentPartService).deleteById(7L);
    }

    @Test
    void update_shouldThrowWhenPartMissing() throws Exception {
        EquipmentPart request = new EquipmentPart();
        request.setId(99L);

        when(equipmentPartService.update(any(EquipmentPart.class)))
                .thenThrow(new RuntimeException("Equipment part not found"));

        Exception exception = assertThrows(
                Exception.class,
                () -> mockMvc.perform(put("/equipment-parts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
        );

        assertTrue(exception.getCause() instanceof RuntimeException);
    }
}
