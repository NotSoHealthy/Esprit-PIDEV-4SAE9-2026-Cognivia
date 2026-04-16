package com.pidev.pharmacy.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.pharmacy.entities.Medication;
import com.pidev.pharmacy.entities.MedicationStock;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.services.MedicationStockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MedicationStockControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private MedicationStockService medicationStockService;

    @InjectMocks
    private MedicationStockController medicationStockController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(medicationStockController).build();
    }

    @Test
    void createStock_shouldReturnCreatedOnSuccess() throws Exception {
        MedicationStock stock = buildStock(12L, 20);

        when(medicationStockService.create(any(MedicationStock.class))).thenReturn(stock);

        mockMvc.perform(post("/medication-stocks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStock(null, 20))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(12))
                .andExpect(jsonPath("$.quantity").value(20));
    }

    @Test
    void createStock_shouldReturnBadRequestWhenServiceFails() throws Exception {
        when(medicationStockService.create(any(MedicationStock.class))).thenThrow(new RuntimeException("bad payload"));

        mockMvc.perform(post("/medication-stocks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildStock(null, 20))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void subscribeToRestock_shouldReturnConflictWhenAlreadySubscribed() throws Exception {
        when(medicationStockService.subscribeToRestock(22L, "u42", "john")).thenReturn(false);

        mockMvc.perform(post("/medication-stocks/22/restock-subscriptions")
                        .param("userId", "u42")
                        .param("username", "john"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Already subscribed"));
    }

    @Test
    void updateQuantity_shouldReturnBadRequestWhenServiceThrows() throws Exception {
        when(medicationStockService.updateQuantity(2L, 3L, 50)).thenThrow(new RuntimeException("invalid"));

        mockMvc.perform(patch("/medication-stocks/pharmacy/2/medication/3/quantity")
                        .param("quantity", "50"))
                .andExpect(status().isBadRequest());
    }

    private MedicationStock buildStock(Long id, int quantity) {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setId(2L);

        Medication medication = new Medication();
        medication.setId(3L);

        MedicationStock stock = new MedicationStock();
        stock.setId(id);
        stock.setQuantity(quantity);
        stock.setPharmacy(pharmacy);
        stock.setMedication(medication);
        return stock;
    }
}
