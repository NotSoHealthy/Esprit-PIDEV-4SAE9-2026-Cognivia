package com.pidev.monitoring.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.pidev.monitoring.entities.HousePerimeter;
import com.pidev.monitoring.repositories.HousePerimeterRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class HousePerimeterServiceTest {

    @Mock
    private HousePerimeterRepository repository;

    @Test
    void getAll_delegates() {
        List<HousePerimeter> list = List.of(new HousePerimeter());
        when(repository.findAll()).thenReturn(list);

        HousePerimeterService service = new HousePerimeterService(repository);
        assertSame(list, service.getAll());
        verify(repository).findAll();
    }

    @Test
    void getById_throwsWhenMissing() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        HousePerimeterService service = new HousePerimeterService(repository);

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class, () -> service.getById(1L));
        assertEquals("House perimeter not found", ex.getMessage());
    }

    @Test
    void getByPatientId_throws404WhenMissing() {
        when(repository.findByPatientId(2L)).thenReturn(Optional.empty());
        HousePerimeterService service = new HousePerimeterService(repository);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.getByPatientId(2L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertTrue(ex.getReason().contains("patientId=2"));
    }

    @Test
    void create_parsesPolygon_setsSrid_andSaves() {
        when(repository.save(any(HousePerimeter.class))).thenAnswer(inv -> inv.getArgument(0));
        HousePerimeterService service = new HousePerimeterService(repository);

        String geoJson = "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[0,1],[1,1],[0,0]]]}";
        HousePerimeter saved = service.create(5L, geoJson);

        assertEquals(5L, saved.getPatientId());
        assertNotNull(saved.getGeom());
        assertEquals(4326, saved.getGeom().getSRID());
        verify(repository).save(any(HousePerimeter.class));
    }

    @Test
    void update_parsesPolygon_andSavesExisting() {
        HousePerimeter existing = new HousePerimeter();
        existing.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any(HousePerimeter.class))).thenAnswer(inv -> inv.getArgument(0));

        HousePerimeterService service = new HousePerimeterService(repository);
        String geoJson = "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[0,1],[1,1],[0,0]]]}";
        HousePerimeter saved = service.update(1L, geoJson);

        assertSame(existing, saved);
        assertNotNull(existing.getGeom());
        assertEquals(4326, existing.getGeom().getSRID());
        verify(repository).save(existing);
    }

    @Test
    void parsePolygon_rejectsBlank() {
        HousePerimeterService service = new HousePerimeterService(repository);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.create(1L, " "));
        assertEquals("geoJson is required", ex.getMessage());
        verifyNoInteractions(repository);
    }

    @Test
    void parsePolygon_rejectsInvalidJson() {
        HousePerimeterService service = new HousePerimeterService(repository);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.create(1L, "not-json"));
        assertTrue(ex.getMessage().startsWith("Invalid GeoJSON"));
        verifyNoInteractions(repository);
    }

    @Test
    void parsePolygon_rejectsNonPolygon() {
        HousePerimeterService service = new HousePerimeterService(repository);

        String point = "{\"type\":\"Point\",\"coordinates\":[0,0]}";
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.create(1L, point));
        assertTrue(ex.getMessage().contains("must be a Polygon"));
        verifyNoInteractions(repository);
    }

    @Test
    void parsePolygon_rejectsInvalidGeometry() {
        HousePerimeterService service = new HousePerimeterService(repository);

        String bowtie = "{\"type\":\"Polygon\",\"coordinates\":[[[0,0],[1,1],[1,0],[0,1],[0,0]]]}";
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.create(1L, bowtie));
        assertEquals("Invalid polygon geometry", ex.getMessage());
        verifyNoInteractions(repository);
    }

    @Test
    void isPointInsidePerimeter_formatsEwktAndDelegatesToRepository() {
        when(repository.existsContainingPoint(any(String.class), eq(10L))).thenReturn(true);
        HousePerimeterService service = new HousePerimeterService(repository);

        boolean inside = service.isPointInsidePerimeter(10.5, 36.8, 10L);
        assertTrue(inside);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(repository).existsContainingPoint(captor.capture(), eq(10L));
        assertTrue(captor.getValue().startsWith("SRID=4326;POINT("));
        assertTrue(captor.getValue().contains("10.500000"));
        assertTrue(captor.getValue().contains("36.800000"));
    }
}
