package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.HousePerimeter;
import com.pidev.monitoring.repositories.HousePerimeterRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class HousePerimeterService {
    private final HousePerimeterRepository housePerimeterRepository;

    // ✅ GeometryFactory locked to SRID 4326
    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    public List<HousePerimeter> getAll() {
        return housePerimeterRepository.findAll();
    }

    public HousePerimeter getById(Long id) {
        return housePerimeterRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("House perimeter not found"));
    }

    public HousePerimeter getByPatientId(Long patientId) {
        return housePerimeterRepository.findByPatientId(patientId)
                .orElseThrow(() -> new EntityNotFoundException("House perimeter not found for patientId=" + patientId));
    }

    public HousePerimeter create(Long patientId, String geoJson) {
        HousePerimeter entity = new HousePerimeter();
        entity.setPatientId(patientId);
        entity.setGeom(parsePolygon(geoJson));
        return housePerimeterRepository.save(entity);
    }

    public HousePerimeter update(Long id, String geoJson) {
        HousePerimeter existing = housePerimeterRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("House perimeter not found"));
        existing.setGeom(parsePolygon(geoJson));
        return housePerimeterRepository.save(existing);
    }

    public void delete(Long id) {
        housePerimeterRepository.deleteById(id);
    }

    private Polygon parsePolygon(String geoJson) {
        if (geoJson == null || geoJson.isBlank()) {
            throw new IllegalArgumentException("geoJson is required");
        }

        // ✅ Pass the GeometryFactory with SRID=4326 directly into the reader
        //    This ensures the parsed geometry already has the correct SRID set
        //    at the factory level, which hibernate-spatial includes in the EWKB header
        GeoJsonReader reader = new GeoJsonReader(GEOMETRY_FACTORY);
        Geometry geometry;
        try {
            geometry = reader.read(geoJson);
        } catch (ParseException e) {
            throw new IllegalArgumentException("Invalid GeoJSON: " + e.getMessage(), e);
        }

        if (!(geometry instanceof Polygon polygon)) {
            throw new IllegalArgumentException("GeoJSON geometry must be a Polygon, got: "
                    + geometry.getGeometryType());
        }

        if (!polygon.isValid()) {
            throw new IllegalArgumentException("Invalid polygon geometry");
        }

        // ✅ Belt-and-suspenders: also set SRID explicitly on the instance
        polygon.setSRID(4326);
        return polygon;
    }
}