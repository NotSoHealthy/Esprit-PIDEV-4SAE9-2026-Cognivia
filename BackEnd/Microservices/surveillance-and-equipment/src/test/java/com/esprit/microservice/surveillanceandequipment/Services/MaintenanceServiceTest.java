package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import com.esprit.microservice.surveillanceandequipment.Entities.MaintenanceStatus;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MaintenanceRepository maintenanceRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private MaintenanceService maintenanceService;

    @Test
    void createMaintenance_shouldSave() {
        Maintenance maintenance = new Maintenance();
        when(maintenanceRepository.save(maintenance)).thenReturn(maintenance);

        Maintenance result = maintenanceService.createMaintenance(maintenance);

        assertEquals(maintenance, result);
        verify(maintenanceRepository).save(maintenance);
    }

    @Test
    void getMaintenanceById_shouldReturnWhenFound() {
        Maintenance maintenance = new Maintenance();
        maintenance.setId(7L);
        when(maintenanceRepository.findById(7L)).thenReturn(Optional.of(maintenance));

        Maintenance result = maintenanceService.getMaintenanceById(7L);

        assertEquals(7L, result.getId());
    }

    @Test
    void getMaintenanceById_shouldThrowWhenMissing() {
        when(maintenanceRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> maintenanceService.getMaintenanceById(99L)
        );

        assertEquals("Maintenance not found with id: 99", exception.getMessage());
    }

    @Test
    void getMaintenancesByEquipmentId_shouldUpdateCompletedAndInProgress() {
        LocalDateTime now = LocalDateTime.now();

        Maintenance shouldComplete = new Maintenance();
        shouldComplete.setStatus(MaintenanceStatus.SCHEDULED);
        shouldComplete.setMaintenanceTime(now.minusHours(3));
        shouldComplete.setMaintenanceCompletionTime(now.minusMinutes(1));

        Maintenance shouldBeInProgress = new Maintenance();
        shouldBeInProgress.setStatus(MaintenanceStatus.SCHEDULED);
        shouldBeInProgress.setMaintenanceTime(now.minusHours(1));
        shouldBeInProgress.setMaintenanceCompletionTime(now.plusHours(1));

        when(maintenanceRepository.findByEquipmentId(1L)).thenReturn(List.of(shouldComplete, shouldBeInProgress));

        List<Maintenance> result = maintenanceService.getMaintenancesByEquipmentId(1L);

        assertEquals(2, result.size());
        assertEquals(MaintenanceStatus.COMPLETED, shouldComplete.getStatus());
        assertEquals(MaintenanceStatus.IN_PROGRESS, shouldBeInProgress.getStatus());
        verify(maintenanceRepository).saveAll(any(List.class));
    }

    @Test
    void getMaintenancesByEquipmentId_shouldNotSaveWhenNothingChanges() {
        LocalDateTime now = LocalDateTime.now();

        Maintenance completed = new Maintenance();
        completed.setStatus(MaintenanceStatus.COMPLETED);
        completed.setMaintenanceTime(now.minusDays(2));
        completed.setMaintenanceCompletionTime(now.minusDays(1));

        when(maintenanceRepository.findByEquipmentId(2L)).thenReturn(List.of(completed));

        List<Maintenance> result = maintenanceService.getMaintenancesByEquipmentId(2L);

        assertEquals(1, result.size());
        verify(maintenanceRepository, never()).saveAll(any(List.class));
    }

    @Test
    void checkAvailability_shouldReturnClosestOverlappingMaintenance() {
        LocalDateTime base = LocalDateTime.now();

        Maintenance first = new Maintenance();
        first.setMaintenanceTime(base.plusHours(1));
        first.setMaintenanceCompletionTime(base.plusHours(4));

        Maintenance second = new Maintenance();
        second.setMaintenanceTime(base.plusHours(2));
        second.setMaintenanceCompletionTime(base.plusHours(5));

        when(maintenanceRepository.findByEquipmentId(10L)).thenReturn(List.of(first, second));

        Optional<Maintenance> result = maintenanceService.checkAvailability(
                10L,
                base.plusHours(3),
                base.plusHours(6)
        );

        assertTrue(result.isPresent());
        assertEquals(second, result.get());
    }

    @Test
    void checkAvailability_shouldReturnEmptyWhenNoOverlap() {
        LocalDateTime base = LocalDateTime.now();

        Maintenance existing = new Maintenance();
        existing.setMaintenanceTime(base.plusHours(1));
        existing.setMaintenanceCompletionTime(base.plusHours(2));

        when(maintenanceRepository.findByEquipmentId(11L)).thenReturn(List.of(existing));

        Optional<Maintenance> result = maintenanceService.checkAvailability(
                11L,
                base.plusHours(3),
                base.plusHours(4)
        );

        assertFalse(result.isPresent());
    }

    @Test
    void getClosestMaintenance_shouldReturnEmptyWhenListIsEmpty() {
        when(maintenanceRepository.findByEquipmentId(33L)).thenReturn(List.of());

        Optional<Maintenance> result = maintenanceService.getClosestMaintenance(33L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getClosestMaintenance_shouldReturnNearestMaintenance() {
        LocalDateTime now = LocalDateTime.now();

        Maintenance far = new Maintenance();
        far.setMaintenanceTime(now.minusHours(5));

        Maintenance near = new Maintenance();
        near.setMaintenanceTime(now.minusMinutes(5));

        when(maintenanceRepository.findByEquipmentId(34L)).thenReturn(List.of(far, near));

        Optional<Maintenance> result = maintenanceService.getClosestMaintenance(34L);

        assertTrue(result.isPresent());
        assertEquals(near, result.get());
    }

    @Test
    void updateAndDelete_shouldDelegateToRepository() {
        Maintenance maintenance = new Maintenance();
        when(maintenanceRepository.save(maintenance)).thenReturn(maintenance);

        Maintenance updated = maintenanceService.updateMaintenance(maintenance);
        maintenanceService.deleteMaintenance(44L);

        assertEquals(maintenance, updated);
        verify(maintenanceRepository).save(maintenance);
        verify(maintenanceRepository).deleteById(44L);
    }
}
