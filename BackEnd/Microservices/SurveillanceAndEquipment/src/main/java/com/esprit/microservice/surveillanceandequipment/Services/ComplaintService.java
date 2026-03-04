package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Complaint;
import com.esprit.microservice.surveillanceandequipment.Entities.ComplaintStatus;
import com.esprit.microservice.surveillanceandequipment.Repositories.ComplaintRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class ComplaintService {
    public final ComplaintRepository repository;

    public List<Complaint> getAllComplaints() {
        return repository.findAll();
    }

    public List<Complaint> getAllComplaintsByPatientId(Long patientId) {
        return repository.findByPatientId(patientId);
    }
    public Complaint createComplaint(Complaint complaint) {
        complaint.setCreatedAt(LocalDateTime.now());
        complaint.setStatus(ComplaintStatus.SUBMITTED);
        return repository.save(complaint);
    }

    public Complaint validateComplaint(Complaint complaint) {


        if (complaint.getStatus() != ComplaintStatus.SUBMITTED) {
            throw new IllegalStateException("Only SUBMITTED complaints can be validated");
        }

        complaint.setStatus(ComplaintStatus.VALIDATED);
        complaint.setReviewedAt(LocalDateTime.now());

        return repository.save(complaint);
    }

    public Complaint dismissComplaint(Complaint complaint) {


        if (complaint.getStatus() != ComplaintStatus.SUBMITTED) {
            throw new IllegalStateException("Only SUBMITTED complaints can be dismissed");
        }

        complaint.setStatus(ComplaintStatus.DISMISSED);
        complaint.setReviewedAt(LocalDateTime.now());

        return repository.save(complaint);
    }

    public Complaint appealComplaint(Complaint complaint) {

        if (complaint.getStatus() != ComplaintStatus.DISMISSED) {
            throw new IllegalStateException("Only DISMISSED complaints can be appealed");
        }

        complaint.setStatus(ComplaintStatus.APPEALED);
        complaint.setReviewedAt(LocalDateTime.now());

        return repository.save(complaint);
    }

    public Complaint closeComplaint(Complaint complaint) {


        if (complaint.getStatus() != ComplaintStatus.APPEALED) {

            throw new IllegalStateException("Only APPEALED complaints can be closed");
        }

        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setResolvedAt(LocalDateTime.now());

        return repository.save(complaint);
    }

    public Complaint startInvestigation(Complaint complaint) {

        if (complaint.getStatus() != ComplaintStatus.VALIDATED) {
            throw new IllegalStateException("Complaint must be VALIDATED first");
        }
        complaint.setInvestigatedAt(LocalDateTime.now());
        complaint.setStatus(ComplaintStatus.UNDER_INVESTIGATION);

        return repository.save(complaint);
    }

    public Complaint takeAction(Complaint complaint) {

        if (complaint.getStatus() != ComplaintStatus.UNDER_INVESTIGATION) {
            throw new IllegalStateException("Complaint must be under investigation");
        }

        complaint.setStatus(ComplaintStatus.ACTION_TAKEN);
        complaint.setResolvedAt(LocalDateTime.now());

        return repository.save(complaint);
    }

    public void deleteComplaint(Long id) {
        repository.deleteById(id);
    }


    @Scheduled(fixedRate = 24 * 60 * 60 * 1000)
    public void deleteExpiredComplaints() {

        LocalDateTime threshold = LocalDateTime.now().minusHours(24);

        List<ComplaintStatus> statusesToDelete = List.of(
                ComplaintStatus.ACTION_TAKEN,
                ComplaintStatus.CLOSED,
                ComplaintStatus.DISMISSED
        );

        List<Complaint> complaintsToDelete =
                repository.findByStatusInAndResolvedAtBefore(
                        statusesToDelete,
                        threshold
                );

        if (!complaintsToDelete.isEmpty()) {
            repository.deleteAll(complaintsToDelete);
            log.info("Deleted {} expired complaints", complaintsToDelete.size());
        } else {
            log.info("No expired complaints found.");
        }
    }
}
