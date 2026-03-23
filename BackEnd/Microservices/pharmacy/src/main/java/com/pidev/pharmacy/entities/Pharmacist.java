package com.pidev.pharmacy.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Pharmacist {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    
    @Column(unique = true)
    private UUID userId;
    
    private String firstName;
    private String lastName;
    private String licenseNumber;
    private String phoneNumber;
    
    @ManyToOne
    @JoinColumn(name = "pharmacy_id")
    @JsonIgnore
    private Pharmacy pharmacy;

    @Transient
    @JsonProperty("pharmacyId")
    public Long getPharmacyId() {
        return pharmacy != null ? pharmacy.getId() : null;
    }
}
