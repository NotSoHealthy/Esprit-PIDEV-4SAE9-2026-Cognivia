package com.pidev.pharmacy.controllers;

import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.Rating;
import com.pidev.pharmacy.services.RatingService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ratings")
@AllArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @GetMapping
    public List<Rating> getAll() {
        return ratingService.getAll();
    }

    @GetMapping("/{id}")
    public Rating getById(@PathVariable Long id) {
        return ratingService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Rating> create(@RequestBody Rating rating) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ratingService.create(rating));
    }

    @PutMapping("/{id}")
    public Rating update(@PathVariable Long id, @RequestBody Rating rating) {
        return ratingService.update(id, rating);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ratingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pharmacy/{pharmacyId}")
    public List<Rating> getByPharmacy(@PathVariable Long pharmacyId) {
        return ratingService.getByPharmacy(pharmacyId);
    }

    @GetMapping("/pharmacy/{pharmacyId}/average")
    public Map<String, Object> getAverage(@PathVariable Long pharmacyId) {
        return Map.of(
                "pharmacyId", pharmacyId,
                "average", ratingService.getAverageForPharmacy(pharmacyId)
        );
    }

    @GetMapping("/favorites/pharmacies")
    public List<Pharmacy> getFavoritePharmacies() {
        return ratingService.getFavoritePharmacies();
    }
}
