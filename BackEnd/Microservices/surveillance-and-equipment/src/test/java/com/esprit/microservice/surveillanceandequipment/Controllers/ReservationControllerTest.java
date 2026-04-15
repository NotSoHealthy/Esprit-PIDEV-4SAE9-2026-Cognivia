package com.esprit.microservice.surveillanceandequipment.Controllers;

import com.esprit.microservice.surveillanceandequipment.Entities.Reservation;
import com.esprit.microservice.surveillanceandequipment.Entities.ReservationStatus;
import com.esprit.microservice.surveillanceandequipment.Services.ReservationService;
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
class ReservationControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private ReservationController reservationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reservationController).build();
    }

    @Test
    void getReservationsByEquipmentId_shouldReturnList() throws Exception {
        Reservation reservation = new Reservation();
        reservation.setId(1L);
        reservation.setStatus(ReservationStatus.ACTIVE);

        when(reservationService.getReservationsByEquipmentId(8L)).thenReturn(List.of(reservation));

        mockMvc.perform(get("/reservation/equipment/8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }

    @Test
    void createReservation_shouldReturnSavedReservation() throws Exception {
        Reservation request = new Reservation();
        request.setPatientId(77L);

        Reservation saved = new Reservation();
        saved.setId(2L);
        saved.setPatientId(77L);
        saved.setStatus(ReservationStatus.SCHEDULED);

        when(reservationService.createReservation(any(Reservation.class))).thenReturn(saved);

        mockMvc.perform(post("/reservation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    void checkOverlap_shouldParseDateParamsAndReturnResult() throws Exception {
        String start = "2026-04-15T10:00:00";
        String end = "2026-04-15T12:00:00";

        Reservation overlap = new Reservation();
        overlap.setId(33L);

        when(reservationService.checkOverlap(eq(6L), eq(LocalDateTime.parse(start)), eq(LocalDateTime.parse(end))))
                .thenReturn(Optional.of(overlap));

        mockMvc.perform(get("/reservation/checkavail")
                        .param("equipmentId", "6")
                        .param("startDate", start)
                        .param("endDate", end))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(33));

        verify(reservationService).checkOverlap(6L, LocalDateTime.parse(start), LocalDateTime.parse(end));
    }
}
