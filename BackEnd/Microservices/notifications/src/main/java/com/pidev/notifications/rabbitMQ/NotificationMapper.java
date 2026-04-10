package com.pidev.notifications.rabbitMQ;

import com.pidev.notifications.dto.CaregiverDto;
import com.pidev.notifications.dto.PatientDto;
import com.pidev.notifications.dto.VisitDto;
import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.RecipientType;
import com.pidev.notifications.events.GenericEvent;
import com.pidev.notifications.openFeign.CareClient;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class NotificationMapper {
    private final CareClient careClient;

    public List<Notification> fromEvent(GenericEvent event){
        return switch (event.getEventType()) {
            case "VISIT_REPORT_SUBMITTED" -> visitReportSubmittedNotificationMapper(event);
            case "VISIT_SCHEDULED" -> visitScheduledNotificationMapper(event);
            default -> throw new IllegalArgumentException("Unsupported event type: " + event.getEventType());
        };
    }

    public List<Notification> visitReportSubmittedNotificationMapper(GenericEvent event){
        Notification notification = new Notification();
        Map<String, Object> payload = event.getPayload();
        long reportId = extractRequiredLong(payload, "reportId");
        long visitId = extractRequiredLong(payload, "visitId");
        VisitDto visitDto = careClient.getVisitById(visitId);
        PatientDto patientDto = careClient.getPatientById(visitDto.getPatientId());
        CaregiverDto caregiverDto = careClient.getCaregiverById(visitDto.getCaregiverId());
        notification.setRecipientId(visitDto.getDoctorId());
        notification.setRecipientType(RecipientType.DOCTOR);
        notification.setTitle("New Visit Report Submitted");
        notification.setMessage(caregiverDto.getFirstName() + " " + caregiverDto.getLastName() + " has submitted a visit report for patient " + patientDto.getFirstName() + " " + patientDto.getLastName());
        notification.setEventType(event.getEventType());
        notification.setReferenceId(visitId);
        return List.of(notification);
    }

    public List<Notification> visitScheduledNotificationMapper(GenericEvent event){
        Notification caregiverNotification = new Notification();
        Notification patientNotification = new Notification();
        Map<String, Object> payload = event.getPayload();
        long visitId = extractRequiredLong(payload, "visitId");
        VisitDto visitDto = careClient.getVisitById(visitId);
        PatientDto patientDto = careClient.getPatientById(visitDto.getPatientId());
        CaregiverDto caregiverDto = careClient.getCaregiverById(visitDto.getCaregiverId());
        caregiverNotification.setRecipientId(visitDto.getCaregiverId());
        caregiverNotification.setRecipientType(RecipientType.CAREGIVER);
        caregiverNotification.setTitle("New Visit Scheduled");
        caregiverNotification.setMessage("You have a new visit scheduled with patient " + patientDto.getFirstName() + " " + patientDto.getLastName() + " on " + visitDto.getDate());
        caregiverNotification.setEventType(event.getEventType());
        caregiverNotification.setReferenceId(visitId);
        patientNotification.setRecipientId(visitDto.getPatientId());
        patientNotification.setRecipientType(RecipientType.PATIENT);
        patientNotification.setTitle("New Visit Scheduled");
        patientNotification.setMessage("You have a new visit scheduled with caregiver " + caregiverDto.getFirstName() + " " + caregiverDto.getLastName() + " on " + visitDto.getDate());
        patientNotification.setEventType(event.getEventType());
        patientNotification.setReferenceId(visitId);;
        return List.of(caregiverNotification, patientNotification);
    }

    private long extractRequiredLong(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            throw new IllegalArgumentException("Missing payload field: " + key);
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String stringValue) {
            try {
                return Long.parseLong(stringValue);
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException("Invalid numeric payload field: " + key + "=" + stringValue, ex);
            }
        }
        throw new IllegalArgumentException("Unsupported payload type for " + key + ": " + value.getClass().getName());
    }
}
