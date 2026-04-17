package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.Rating;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import com.pidev.pharmacy.repositories.RatingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private PharmacyRepository pharmacyRepository;

    @InjectMocks
    private RatingService ratingService;

    @Test
    void create_shouldSetFavoriteDefaultAndSave() {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setId(4L);

        Rating rating = new Rating();
        rating.setId(99L);
        rating.setRating(5);
        rating.setUsername("alice");
        rating.setPharmacy(pharmacy);

        when(pharmacyRepository.findById(4L)).thenReturn(Optional.of(pharmacy));
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Rating created = ratingService.create(rating);

        assertEquals(null, created.getId());
        assertFalse(created.getIsFavorite());
        assertEquals(4L, created.getPharmacy().getId());
    }

    @Test
    void create_shouldThrowWhenRatingOutOfRange() {
        Pharmacy pharmacy = new Pharmacy();
        pharmacy.setId(4L);

        Rating rating = new Rating();
        rating.setRating(9);
        rating.setPharmacy(pharmacy);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> ratingService.create(rating));

        assertEquals("Rating must be between 0 and 5", ex.getMessage());
    }

    @Test
    void getAverageForPharmacy_shouldReturnCalculatedAverage() {
        Rating r1 = new Rating();
        r1.setRating(4);
        Rating r2 = new Rating();
        r2.setRating(2);

        when(ratingRepository.findByPharmacyId(8L)).thenReturn(List.of(r1, r2));

        double average = ratingService.getAverageForPharmacy(8L);

        assertEquals(3.0, average);
    }
}
