package com.pidev.monitoring.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.monitoring.converters.PolygonEwkbConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.geojson.GeoJsonWriter;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HousePerimeter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = PolygonEwkbConverter.class)
    @Column(columnDefinition = "geometry(Polygon,4326)")
    @JsonIgnore
    private Polygon geom;
    private Long patientId;
    private Instant createdAt;
    private Instant updatedAt;

    @JsonProperty("geometry")
    public JsonNode getGeometry() {
        if (geom == null) return null;
        try {
            String geoJson = new GeoJsonWriter().write(geom);
            return new ObjectMapper().readTree(geoJson);
        } catch (Exception e) {
            return null;
        }
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}