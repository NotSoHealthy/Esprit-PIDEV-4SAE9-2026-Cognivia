package com.esprit.microservice.surveillanceandequipment.Services;

import com.esprit.microservice.surveillanceandequipment.Entities.Complaint;
import com.esprit.microservice.surveillanceandequipment.Entities.ComplaintStatus;
import com.esprit.microservice.surveillanceandequipment.Repositories.ComplaintRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @InjectMocks
    private ComplaintService complaintService;

    @Test
    void createComplaint_shouldSetDefaultsAndSave() {
        Complaint input = new Complaint();

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Complaint saved = complaintService.createComplaint(input);

        assertEquals(ComplaintStatus.SUBMITTED, saved.getStatus());
        assertNotNull(saved.getCreatedAt());
        verify(complaintRepository).save(input);
    }

    @Test
    void validateComplaint_shouldMoveFromSubmittedToValidated() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.SUBMITTED);

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Complaint result = complaintService.validateComplaint(complaint);

        assertEquals(ComplaintStatus.VALIDATED, result.getStatus());
        assertNotNull(result.getReviewedAt());
        verify(complaintRepository).save(complaint);
    }

    @Test
    void validateComplaint_shouldThrowWhenStatusIsNotSubmitted() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.DISMISSED);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> complaintService.validateComplaint(complaint)
        );

        assertEquals("Only SUBMITTED complaints can be validated", exception.getMessage());
        verify(complaintRepository, never()).save(any());
    }

    @Test
    void dismissComplaint_shouldMoveFromSubmittedToDismissed() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.SUBMITTED);

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Complaint result = complaintService.dismissComplaint(complaint);

        assertEquals(ComplaintStatus.DISMISSED, result.getStatus());
        assertNotNull(result.getReviewedAt());
        verify(complaintRepository).save(complaint);
    }

    @Test
    void dismissComplaint_shouldThrowWhenStatusIsNotSubmitted() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.VALIDATED);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> complaintService.dismissComplaint(complaint)
        );

        assertEquals("Only SUBMITTED complaints can be dismissed", exception.getMessage());
        verify(complaintRepository, never()).save(any());
    }

    @Test
    void appealComplaint_shouldMoveFromDismissedToAppealed() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.DISMISSED);

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Complaint result = complaintService.appealComplaint(complaint);

        assertEquals(ComplaintStatus.APPEALED, result.getStatus());
        assertNotNull(result.getReviewedAt());
        verify(complaintRepository).save(complaint);
    }

    @Test
    void closeComplaint_shouldMoveFromAppealedToClosed() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.APPEALED);

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Complaint result = complaintService.closeComplaint(complaint);

        assertEquals(ComplaintStatus.CLOSED, result.getStatus());
        assertNotNull(result.getResolvedAt());
        verify(complaintRepository).save(complaint);
    }

    @Test
    void startInvestigation_shouldMoveFromValidatedToUnderInvestigation() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.VALIDATED);

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Complaint result = complaintService.startInvestigation(complaint);

        assertEquals(ComplaintStatus.UNDER_INVESTIGATION, result.getStatus());
        assertNotNull(result.getInvestigatedAt());
        verify(complaintRepository).save(complaint);
    }

    @Test
    void takeAction_shouldMoveFromUnderInvestigationToActionTaken() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.UNDER_INVESTIGATION);

        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Complaint result = complaintService.takeAction(complaint);

        assertEquals(ComplaintStatus.ACTION_TAKEN, result.getStatus());
        assertNotNull(result.getResolvedAt());
        verify(complaintRepository).save(complaint);
    }

    @Test
    void takeAction_shouldThrowWhenComplaintNotUnderInvestigation() {
        Complaint complaint = new Complaint();
        complaint.setStatus(ComplaintStatus.SUBMITTED);

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> complaintService.takeAction(complaint)
        );

        assertEquals("Complaint must be under investigation", exception.getMessage());
        verify(complaintRepository, never()).save(any());
    }

    @Test
    void deleteExpiredComplaints_shouldDeleteResolvedComplaintsOlderThan24Hours() {
        Complaint oldClosedComplaint = new Complaint();
        oldClosedComplaint.setStatus(ComplaintStatus.CLOSED);
        oldClosedComplaint.setResolvedAt(LocalDateTime.now().minusDays(2));

        when(complaintRepository.findByStatusInAndResolvedAtBefore(any(), any(LocalDateTime.class)))
                .thenReturn(List.of(oldClosedComplaint));

        complaintService.deleteExpiredComplaints();

        verify(complaintRepository).deleteAll(List.of(oldClosedComplaint));
    }

    @Test
    void deleteExpiredComplaints_shouldNotDeleteWhenNoExpiredComplaints() {
        when(complaintRepository.findByStatusInAndResolvedAtBefore(any(), any(LocalDateTime.class)))
                .thenReturn(List.of());

        complaintService.deleteExpiredComplaints();

        verify(complaintRepository, never()).deleteAll(any(List.class));
    }
}
