package com.pidev.monitoring.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class TestAssignment {

    public TestAssignment() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "test_id")
    private CognitiveTest test;

    @Column(columnDefinition = "TIMESTAMP")
    private LocalDateTime assignedAt = LocalDateTime.now();

    @Column(columnDefinition = "TIMESTAMP")
    private LocalDateTime dueAt;

    @Enumerated(EnumType.STRING)
    private Frequency frequency;

    // --- New fields ---

    /**
     * TARGETED = one specific patient, GENERAL = all patients of a severity group
     */
    @Enumerated(EnumType.STRING)
    private AssignmentType assignmentType = AssignmentType.GENERAL;

    /**
     * Populated when assignmentType = TARGETED. References the patient ID in the
     * care service DB.
     */
    private Long patientId;

    /**
     * Populated when assignmentType = GENERAL. Targets all patients with this
     * severity.
     */
    @Enumerated(EnumType.STRING)
    private SeverityTarget targetSeverity;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<TestResult> results = new ArrayList<>();

    // --- Getters & Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDateTime getDueAt() {
        return dueAt;
    }

    public void setDueAt(LocalDateTime dueAt) {
        this.dueAt = dueAt;
    }

    public Frequency getFrequency() {
        return frequency;
    }

    public void setFrequency(Frequency frequency) {
        this.frequency = frequency;
    }

    public List<TestResult> getResults() {
        return results;
    }

    public void setResults(List<TestResult> results) {
        this.results = results;
    }

    public CognitiveTest getTest() {
        return test;
    }

    public void setTest(CognitiveTest test) {
        this.test = test;
    }

    public AssignmentType getAssignmentType() {
        return assignmentType;
    }

    public void setAssignmentType(AssignmentType assignmentType) {
        this.assignmentType = assignmentType;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public SeverityTarget getTargetSeverity() {
        return targetSeverity;
    }

    public void setTargetSeverity(SeverityTarget targetSeverity) {
        this.targetSeverity = targetSeverity;
    }
}
