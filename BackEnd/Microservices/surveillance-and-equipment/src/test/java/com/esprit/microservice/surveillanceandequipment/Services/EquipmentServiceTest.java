package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Controllers.DeepseekClient;
import com.esprit.microservice.surveillanceandequipment.Entities.Equipment;
import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentStatus;
import com.esprit.microservice.surveillanceandequipment.Entities.Maintenance;
import com.esprit.microservice.surveillanceandequipment.Entities.Reservation;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.MaintenanceRepository;
import com.esprit.microservice.surveillanceandequipment.Repositories.ReservationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private MaintenanceRepository maintenanceRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private DeepseekClient deepseekClient;

    private EquipmentService equipmentService;

    @BeforeEach
    void setUp() {
        equipmentService = new EquipmentService(
                equipmentRepository,
                maintenanceRepository,
                reservationRepository,
                deepseekClient,
                new ObjectMapper()
        );
    }

    @Test
    void getEquipmentById_shouldReturnEquipmentWhenExists() {
        Equipment equipment = new Equipment();
        equipment.setId(5L);

        when(equipmentRepository.findById(5L)).thenReturn(Optional.of(equipment));

        Equipment result = equipmentService.getEquipmentById(5L);

        assertEquals(5L, result.getId());
    }

    @Test
    void getEquipmentById_shouldThrowWhenNotFound() {
        when(equipmentRepository.findById(404L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> equipmentService.getEquipmentById(404L));

        assertEquals("Equipment not found", exception.getMessage());
    }

    @Test
    void getAllEquipment_shouldPrioritizeMaintenanceOverReservationAndFallbackToAvailable() {
        Equipment maintenanceEquipment = new Equipment();
        maintenanceEquipment.setId(1L);
        maintenanceEquipment.setStatus(EquipmentStatus.AVAILABLE);

        Equipment reservedEquipment = new Equipment();
        reservedEquipment.setId(2L);
        reservedEquipment.setStatus(EquipmentStatus.AVAILABLE);

        Equipment availableEquipment = new Equipment();
        availableEquipment.setId(3L);
        availableEquipment.setStatus(EquipmentStatus.RESERVED);

        when(equipmentRepository.findAll()).thenReturn(List.of(maintenanceEquipment, reservedEquipment, availableEquipment));

        when(maintenanceRepository
                .findByEquipmentIdAndMaintenanceTimeLessThanEqualAndMaintenanceCompletionTimeGreaterThanEqual(anyLong(), any(), any()))
                .thenAnswer(invocation -> {
                    Long equipmentId = invocation.getArgument(0);
                    if (equipmentId == 1L) {
                        return List.of(new Maintenance());
                    }
                    return List.of();
                });

        when(reservationRepository
                .findByEquipmentIdAndReservationDateLessThanEqualAndReturnDateGreaterThanEqual(anyLong(), any(), any()))
                .thenAnswer(invocation -> {
                    Long equipmentId = invocation.getArgument(0);
                    if (equipmentId == 2L) {
                        return List.of(new Reservation());
                    }
                    return List.of();
                });

        List<Equipment> result = equipmentService.getAllEquipment();

        assertEquals(3, result.size());
        assertEquals(EquipmentStatus.MAINTENANCE, maintenanceEquipment.getStatus());
        assertEquals(EquipmentStatus.RESERVED, reservedEquipment.getStatus());
        assertEquals(EquipmentStatus.AVAILABLE, availableEquipment.getStatus());
        verify(equipmentRepository).save(maintenanceEquipment);
        verify(equipmentRepository).save(reservedEquipment);
        verify(equipmentRepository).save(availableEquipment);
    }

    @Test
    void getAllEquipment_shouldNotSaveWhenStatusAlreadyCorrect() {
        Equipment equipment = new Equipment();
        equipment.setId(20L);
        equipment.setStatus(EquipmentStatus.AVAILABLE);

        when(equipmentRepository.findAll()).thenReturn(List.of(equipment));
        when(maintenanceRepository
                .findByEquipmentIdAndMaintenanceTimeLessThanEqualAndMaintenanceCompletionTimeGreaterThanEqual(anyLong(), any(), any()))
                .thenReturn(List.of());
        when(reservationRepository
                .findByEquipmentIdAndReservationDateLessThanEqualAndReturnDateGreaterThanEqual(anyLong(), any(), any()))
                .thenReturn(List.of());

        equipmentService.getAllEquipment();

        verify(equipmentRepository, never()).save(any(Equipment.class));
    }

    @Test
    void buildEquipmentFromText_shouldParseJsonAndApplyDefaults() {
        when(deepseekClient.askDeepSeek(any(), any())).thenReturn("""
                ```json
                {
                  \"name\": \"Ultrasound Scanner\",
                  \"description\": \"Portable imaging device\"
                }
                ```
                """);

        Equipment result = equipmentService.buildEquipmentFromText("Some OCR text");

        assertEquals("Ultrasound Scanner", result.getName());
        assertEquals("Portable imaging device", result.getDescription());
        assertEquals(80, result.getConditionScore());
        assertEquals(EquipmentStatus.AVAILABLE, result.getStatus());
    }

    @Test
    void buildEquipmentFromText_shouldThrowWhenAiResponseIsInvalidJson() {
        when(deepseekClient.askDeepSeek(any(), any())).thenReturn("not-a-json");

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> equipmentService.buildEquipmentFromText("raw text")
        );

        assertTrue(exception.getMessage().startsWith("Failed to parse AI response:"));
    }

    @Test
    void buildEquipmentFromText_shouldAllowMissingTextFields() {
        when(deepseekClient.askDeepSeek(any(), any())).thenReturn("{\"conditionScore\": 95}");

        Equipment result = equipmentService.buildEquipmentFromText("raw text");

        assertNull(result.getName());
        assertNull(result.getDescription());
        assertEquals(95, result.getConditionScore());
    }
}
