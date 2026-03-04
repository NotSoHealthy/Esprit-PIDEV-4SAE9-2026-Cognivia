package com.pidev.pharmacy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PharmacyUpdateLocationDTO {

    private String address;
    private Double longitude;
    private Double latitude;
}

