package com.pidev.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PharmacyUpdateInfoDTO {

    private String name;
    private String address;
    private String description;
    private String bannerUrl;
    private String logoUrl;
    private Instant updatedAt;
}

