package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Reservation;
import com.esprit.microservice.surveillanceandequipment.Entities.ReservationStatus;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.MaintenanceRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.ReservationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MaintenanceRepository maintenanceRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void getReservationsByEquipmentId_shouldUpdateStatusesForActiveAndReturned() {
        LocalDateTime now = LocalDateTime.now();

        Reservation currentlyActive = new Reservation();
        currentlyActive.setStatus(ReservationStatus.SCHEDULED);
        currentlyActive.setReservationDate(now.minusHours(1));
        currentlyActive.setReturnDate(now.plusHours(1));

        Reservation alreadyEnded = new Reservation();
        alreadyEnded.setStatus(ReservationStatus.ACTIVE);
        alreadyEnded.setReservationDate(now.minusHours(3));
        alreadyEnded.setReturnDate(now.minusHours(1));

        when(reservationRepository.findByEquipmentId(1L)).thenReturn(List.of(currentlyActive, alreadyEnded));

        List<Reservation> result = reservationService.getReservationsByEquipmentId(1L);

        assertEquals(2, result.size());
        assertEquals(ReservationStatus.ACTIVE, currentlyActive.getStatus());
        assertEquals(ReservationStatus.RETURNED, alreadyEnded.getStatus());
        verify(reservationRepository).saveAll(any(List.class));
    }

    @Test
    void getReservationsByEquipmentId_shouldNotSaveWhenNothingNeedsUpdate() {
        LocalDateTime now = LocalDateTime.now();

        Reservation returnedReservation = new Reservation();
        returnedReservation.setStatus(ReservationStatus.RETURNED);
        returnedReservation.setReservationDate(now.minusDays(2));
        returnedReservation.setReturnDate(now.minusDays(1));

        when(reservationRepository.findByEquipmentId(1L)).thenReturn(List.of(returnedReservation));

        List<Reservation> result = reservationService.getReservationsByEquipmentId(1L);

        assertEquals(1, result.size());
        verify(reservationRepository, never()).saveAll(any(List.class));
    }

    @Test
    void checkOverlap_shouldReturnMatchingReservationWhenOverlapExists() {
        LocalDateTime base = LocalDateTime.now();

        Reservation existing = new Reservation();
        existing.setReservationDate(base.plusHours(1));
        existing.setReturnDate(base.plusHours(3));

        when(reservationRepository.findByEquipmentId(10L)).thenReturn(List.of(existing));

        Optional<Reservation> overlap = reservationService.checkOverlap(
                10L,
                base.plusHours(2),
                base.plusHours(4)
        );

        assertTrue(overlap.isPresent());
        assertEquals(existing, overlap.get());
    }

    @Test
    void checkOverlap_shouldReturnEmptyWhenNoOverlapExists() {
        LocalDateTime base = LocalDateTime.now();

        Reservation existing = new Reservation();
        existing.setReservationDate(base.plusHours(1));
        existing.setReturnDate(base.plusHours(2));

        when(reservationRepository.findByEquipmentId(11L)).thenReturn(List.of(existing));

        Optional<Reservation> overlap = reservationService.checkOverlap(
                11L,
                base.plusHours(3),
                base.plusHours(4)
        );

        assertFalse(overlap.isPresent());
    }

    @Test
    void getClosestReservation_shouldReturnEmptyWhenNoReservations() {
        when(reservationRepository.findByEquipmentId(99L)).thenReturn(List.of());

        Optional<Reservation> result = reservationService.getClosestReservation(99L);

        assertTrue(result.isEmpty());
    }
}
