package com.pidev.pharmacy.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer rating;

    private String username;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private Boolean isFavorite;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pharmacy_id", nullable = false)
    private Pharmacy pharmacy;

    @PrePersist
    public void prePersist() {
        if (isFavorite == null) {
            isFavorite = false;
        }
    }
}
