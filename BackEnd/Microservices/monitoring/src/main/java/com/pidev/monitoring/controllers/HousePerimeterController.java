package com.pidev.monitoring.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pidev.monitoring.entities.HousePerimeter;
import com.pidev.monitoring.services.HousePerimeterService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/house-perimeters")
@AllArgsConstructor
public class HousePerimeterController {

    private final HousePerimeterService housePerimeterService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public List<HousePerimeter> getAllHousePerimeters() {
        return housePerimeterService.getAll();
    }

    @GetMapping("/{id}")
    public HousePerimeter getHousePerimeterById(@PathVariable Long id) {
        return housePerimeterService.getById(id);
    }

    @GetMapping(params = "patientId")
    public HousePerimeter getHousePerimeterByPatientId(@RequestParam Long patientId) {
        return housePerimeterService.getByPatientId(patientId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public HousePerimeter createHousePerimeter(
            @RequestParam Long patientId,
            @RequestBody JsonNode geoJson   // ✅ Accept JsonNode, not raw String
    ) {
        return housePerimeterService.create(patientId, toJsonString(geoJson));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public HousePerimeter updateHousePerimeter(
            @PathVariable Long id,
            @RequestBody JsonNode geoJson   // ✅ Accept JsonNode, not raw String
    ) {
        return housePerimeterService.update(id, toJsonString(geoJson));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHousePerimeter(@PathVariable Long id) {
        housePerimeterService.delete(id);
    }

    // ✅ Helper: safely convert JsonNode back to String for GeoJsonReader
    private String toJsonString(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON body", e);
        }
    }
}