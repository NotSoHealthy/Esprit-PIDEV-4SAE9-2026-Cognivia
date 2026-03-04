package com.pidev.pharmacy.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;


@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "prescription")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 10, unique = true)
    private String code;

    private String doctorName;
    private String patientName;
    private String description;
    private Instant createdAt;
    private Instant expiresAt;

    @JsonManagedReference
    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PrescriptionItem> items = new ArrayList<>();

    private void syncItemBackReferences() {
        if (items == null) {
            return;
        }
        items.forEach(item -> item.setPrescription(this));
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        syncItemBackReferences();
    }

    @PreUpdate
    public void preUpdate() {
        syncItemBackReferences();
    }
}