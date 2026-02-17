package com.pidev.care.repositories;

import com.pidev.care.entities.PatientDoctorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientDoctorAssignmentRepository extends JpaRepository<PatientDoctorAssignment, Long> {
}
