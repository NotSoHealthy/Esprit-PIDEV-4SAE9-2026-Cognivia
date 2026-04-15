package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.EquipmentPart;
import com.esprit.microservice.surveillanceandequipment.Repositories.EquipmentPartRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EquipmentPartServiceTest {

    @Mock
    private EquipmentPartRepository repository;

    @InjectMocks
    private EquipmentPartService equipmentPartService;

    @Test
    void save_shouldPersistPart() {
        EquipmentPart part = new EquipmentPart();
        when(repository.save(part)).thenReturn(part);

        EquipmentPart result = equipmentPartService.save(part);

        assertEquals(part, result);
        verify(repository).save(part);
    }

    @Test
    void getByEquipment_shouldReturnPartsForEquipment() {
        EquipmentPart part = new EquipmentPart();
        part.setEquipmentId(5L);
        when(repository.findByEquipmentId(5L)).thenReturn(List.of(part));

        List<EquipmentPart> result = equipmentPartService.getByEquipment(5L);

        assertEquals(1, result.size());
        assertEquals(5L, result.get(0).getEquipmentId());
    }

    @Test
    void update_shouldPersistWhenPartExists() {
        EquipmentPart part = new EquipmentPart();
        part.setId(9L);

        when(repository.existsById(9L)).thenReturn(true);
        when(repository.save(part)).thenReturn(part);

        EquipmentPart result = equipmentPartService.update(part);

        assertEquals(part, result);
        verify(repository).existsById(9L);
        verify(repository).save(part);
    }

    @Test
    void update_shouldThrowWhenPartMissing() {
        EquipmentPart part = new EquipmentPart();
        part.setId(10L);

        when(repository.existsById(10L)).thenReturn(false);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> equipmentPartService.update(part)
        );

        assertEquals("Equipment part not found", exception.getMessage());
    }

    @Test
    void deleteById_shouldDelegateToRepository() {
        equipmentPartService.deleteById(3L);

        verify(repository).deleteById(3L);
    }
}
