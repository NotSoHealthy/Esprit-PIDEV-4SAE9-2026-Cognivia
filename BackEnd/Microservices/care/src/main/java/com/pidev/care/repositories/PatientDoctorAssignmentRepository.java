package com.pidev.care.repositories;

import com.pidev.care.entities.PatientDoctorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientDoctorAssignmentRepository extends JpaRepository<PatientDoctorAssignment, Long> {
    List<PatientDoctorAssignment> findByDoctorId(Long doctorId);
    PatientDoctorAssignment findByPatientId(Long patientId);
}
