package com.esprit.microservice.appointmentservice.repository;

import com.esprit.microservice.appointmentservice.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctorId(Long doctorId);

    // Conflict if:
    // existing.start < new.end AND existing.end > new.start
    // existing.end = existing.start + existing.durationMinutes

    @Query(value = """
        SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
        FROM appointments a
        WHERE a.doctor_id = :doctorId
          AND a.status IN ('PENDING', 'APPROVED')
          AND a.appointment_date < :newEnd
          AND (a.appointment_date + (a.duration_minutes || ' minutes')::interval) > :newStart
        """, nativeQuery = true)
    boolean existsOverlap(
            @Param("doctorId") Long doctorId,
            @Param("newStart") OffsetDateTime newStart,
            @Param("newEnd") OffsetDateTime newEnd
    );

    @Query(value = """
        SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
        FROM appointments a
        WHERE a.doctor_id = :doctorId
          AND a.id <> :excludeId
          AND a.status IN ('PENDING', 'APPROVED')
          AND a.appointment_date < :newEnd
          AND (a.appointment_date + (a.duration_minutes || ' minutes')::interval) > :newStart
        """, nativeQuery = true)
    boolean existsOverlapExcludingId(
            @Param("doctorId") Long doctorId,
            @Param("excludeId") Long excludeId,
            @Param("newStart") OffsetDateTime newStart,
            @Param("newEnd") OffsetDateTime newEnd
    );
}