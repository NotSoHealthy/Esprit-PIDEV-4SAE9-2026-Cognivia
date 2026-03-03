package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Complaint;
import com.esprit.microservice.surveillanceandequipment.Entities.ComplaintStatus;
import com.esprit.microservice.surveillanceandequipment.Repositories.ComplaintRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
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
        complaint.setResolvedAt(LocalDateTime.now());

        return repository.save(complaint);
    }
    public Complaint startInvestigation(Complaint complaint) {

        if (complaint.getStatus() != ComplaintStatus.VALIDATED) {
            throw new IllegalStateException("Complaint must be VALIDATED first");
        }

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

    public Complaint closeComplaint(Complaint complaint) {


        if (complaint.getStatus() != ComplaintStatus.ACTION_TAKEN &&
                complaint.getStatus() != ComplaintStatus.DISMISSED) {

            throw new IllegalStateException("Only resolved complaints can be closed");
        }

        complaint.setStatus(ComplaintStatus.CLOSED);

        return repository.save(complaint);
    }

    public void deleteComplaint(Long id) {
        repository.deleteById(id);
    }
}
