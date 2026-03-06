package com.pidev.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionPharmacyRecommendationDTO {
    private Long pharmacyId;
    private String pharmacyName;
    private String address;
    private String contactInfo;
    private String bannerUrl;
    private String logoUrl;
    private Integer matchCount;
    private Integer totalMedications;
    private Integer totalAvailableQuantity;
}
