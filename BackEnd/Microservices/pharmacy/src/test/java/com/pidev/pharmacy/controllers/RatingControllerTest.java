package com.pidev.pharmacy.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.Rating;
import com.pidev.pharmacy.services.RatingService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RatingControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private RatingService ratingService;

    @InjectMocks
    private RatingController ratingController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(ratingController).build();
    }

    @Test
    void create_shouldReturnCreatedStatus() throws Exception {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setId(3L);

        Rating saved = new Rating();
        saved.setId(15L);
        saved.setRating(4);
        saved.setUsername("john");
        saved.setPharmacy(pharmacy);

        Rating input = new Rating();
        input.setRating(4);
        input.setUsername("john");
        input.setPharmacy(pharmacy);

        when(ratingService.create(any(Rating.class))).thenReturn(saved);

        mockMvc.perform(post("/ratings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(15));
    }

    @Test
    void getAverage_shouldExposePharmacyIdAndAverage() throws Exception {
        when(ratingService.getAverageForPharmacy(9L)).thenReturn(4.5);

        mockMvc.perform(get("/ratings/pharmacy/9/average"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pharmacyId").value(9))
                .andExpect(jsonPath("$.average").value(4.5));
    }
}
