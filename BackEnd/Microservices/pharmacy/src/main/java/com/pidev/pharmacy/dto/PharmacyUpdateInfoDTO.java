package com.pidev.pharmacy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

    @NotBlank(message = "Pharmacy name is required")
    @Size(min = 3, max = 100, message = "Pharmacy name must be between 3 and 100 characters")
    private String name;
    
    private String address;
    
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;
    
    @NotBlank(message = "Contact info is required")
    @Pattern(regexp = "^\\d{8}$", message = "Contact info must be exactly 8 digits")
    private String contactInfo;
    
    private String bannerUrl;
    private String logoUrl;
    private Instant updatedAt;
}

