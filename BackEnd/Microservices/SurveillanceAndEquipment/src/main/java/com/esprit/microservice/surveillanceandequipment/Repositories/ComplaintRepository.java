package com.esprit.microservice.surveillanceandequipment.Repositories;

import com.esprit.microservice.surveillanceandequipment.Entities.Complaint;
import com.esprit.microservice.surveillanceandequipment.Entities.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByPatientId(Long patientId);

    List<Complaint> findByStatus(ComplaintStatus status);

    List<Complaint> findByTargetUserId(Long targetUserId);

    List<Complaint> findByStatusInAndResolvedAtBefore(
            List<ComplaintStatus> statuses,
            LocalDateTime dateTime
    );
}
