package com.pidev.notifications.rabbitMQ;

import com.pidev.notifications.dto.CaregiverDto;
import com.pidev.notifications.dto.DoctorDto;
import com.pidev.notifications.dto.PatientDto;
import com.pidev.notifications.dto.VisitDto;
import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.RecipientType;
import com.pidev.notifications.events.GenericEvent;
import com.pidev.notifications.openFeign.CareClient;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@AllArgsConstructor
@Slf4j
public class NotificationMapper {
    private final CareClient careClient;

    public record NotificationDelivery(Notification notification, UUID recipientUserId) {
    }

    public List<Notification> fromEvent(GenericEvent event) {
        return switch (event.getEventType()) {
            case "VISIT_REPORT_SUBMITTED" -> visitReportSubmittedNotificationMapper(event);
            case "VISIT_SCHEDULED" -> visitScheduledNotificationMapper(event);
            case "NEW_CHAT_MESSAGE" -> chatMessageNotificationMapper(event);
            case "TEST_ASSIGNED" -> testAssignedNotificationMapper(event);
            default -> throw new IllegalArgumentException("Unsupported event type: " + event.getEventType());
        };
    }

    public List<NotificationDelivery> fromEventDeliveries(GenericEvent event) {
        return switch (event.getEventType()) {
            case "VISIT_REPORT_SUBMITTED" -> visitReportSubmittedDeliveries(event);
            case "VISIT_SCHEDULED" -> visitScheduledDeliveries(event);
            case "NEW_CHAT_MESSAGE" -> chatMessageDeliveries(event);
            case "TEST_ASSIGNED" -> testAssignedDeliveries(event);
            default -> throw new IllegalArgumentException("Unsupported event type: " + event.getEventType());
        };
    }

    public List<Notification> visitReportSubmittedNotificationMapper(GenericEvent event) {
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
        notification.setMessage(caregiverDto.getFirstName() + " " + caregiverDto.getLastName()
                + " has submitted a visit report for patient " + patientDto.getFirstName() + " "
                + patientDto.getLastName());
        notification.setEventType(event.getEventType());
        notification.setReferenceId(visitId);
        return List.of(notification);
    }

    private List<NotificationDelivery> visitReportSubmittedDeliveries(GenericEvent event) {
        Notification notification = new Notification();
        Map<String, Object> payload = event.getPayload();
        extractRequiredLong(payload, "reportId");
        long visitId = extractRequiredLong(payload, "visitId");

        VisitDto visitDto = careClient.getVisitById(visitId);
        PatientDto patientDto = careClient.getPatientById(visitDto.getPatientId());
        CaregiverDto caregiverDto = careClient.getCaregiverById(visitDto.getCaregiverId());
        DoctorDto doctorDto = careClient.getDoctorById(visitDto.getDoctorId());

        notification.setRecipientId(visitDto.getDoctorId());
        notification.setRecipientType(RecipientType.DOCTOR);
        notification.setTitle("New Visit Report Submitted");
        notification.setMessage(caregiverDto.getFirstName() + " " + caregiverDto.getLastName()
                + " has submitted a visit report for patient "
                + patientDto.getFirstName() + " " + patientDto.getLastName());
        notification.setEventType(event.getEventType());
        notification.setReferenceId(visitId);

        return List.of(new NotificationDelivery(notification, doctorDto.getUserId()));
    }

    public List<Notification> visitScheduledNotificationMapper(GenericEvent event) {
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
        caregiverNotification.setMessage("You have a new visit scheduled with patient " + patientDto.getFirstName()
                + " " + patientDto.getLastName() + " on " + visitDto.getDate());
        caregiverNotification.setEventType(event.getEventType());
        caregiverNotification.setReferenceId(visitId);
        patientNotification.setRecipientId(visitDto.getPatientId());
        patientNotification.setRecipientType(RecipientType.PATIENT);
        patientNotification.setTitle("New Visit Scheduled");
        patientNotification.setMessage("You have a new visit scheduled with caregiver " + caregiverDto.getFirstName()
                + " " + caregiverDto.getLastName() + " on " + visitDto.getDate());
        patientNotification.setEventType(event.getEventType());
        patientNotification.setReferenceId(visitId);
        return List.of(caregiverNotification, patientNotification);
    }

    private List<NotificationDelivery> visitScheduledDeliveries(GenericEvent event) {
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
        caregiverNotification.setMessage("You have a new visit scheduled with patient "
                + patientDto.getFirstName() + " " + patientDto.getLastName() + " on " + visitDto.getDate());
        caregiverNotification.setEventType(event.getEventType());
        caregiverNotification.setReferenceId(visitId);

        patientNotification.setRecipientId(visitDto.getPatientId());
        patientNotification.setRecipientType(RecipientType.PATIENT);
        patientNotification.setTitle("New Visit Scheduled");
        patientNotification.setMessage("You have a new visit scheduled with caregiver "
                + caregiverDto.getFirstName() + " " + caregiverDto.getLastName() + " on " + visitDto.getDate());
        patientNotification.setEventType(event.getEventType());
        patientNotification.setReferenceId(visitId);

        return List.of(
                new NotificationDelivery(caregiverNotification, caregiverDto.getUserId()),
                new NotificationDelivery(patientNotification, patientDto.getUserId()));
    }

    public List<Notification> testAssignedNotificationMapper(GenericEvent event) {
        Notification notification = new Notification();
        Map<String, Object> payload = event.getPayload();
        long testId = extractRequiredLong(payload, "testId");
        String testName = (String) payload.getOrDefault("testName", "Cognitive Test");
        long patientId = extractRequiredLong(payload, "patientId");

        notification.setRecipientId(patientId);
        notification.setRecipientType(RecipientType.PATIENT);
        notification.setTitle("New Test Assigned");
        notification.setMessage("A new cognitive test '" + testName + "' has been assigned to you. Please complete it at your earliest convenience.");
        notification.setEventType(event.getEventType());
        notification.setReferenceId(testId);
        return List.of(notification);
    }

    private List<NotificationDelivery> testAssignedDeliveries(GenericEvent event) {
        log.info("Mapping TEST_ASSIGNED event payload: {}", event.getPayload());
        List<Notification> notifications = testAssignedNotificationMapper(event);
        if (notifications.isEmpty()) {
            log.warn("No notifications generated for TEST_ASSIGNED event");
            return List.of();
        }

        Notification notification = notifications.get(0);
        long patientId = extractRequiredLong(event.getPayload(), "patientId");
        log.info("Fetching patient profile for patientId: {} from care service", patientId);
        
        try {
            PatientDto patientDto = careClient.getPatientById(patientId);

            if (patientDto == null) {
                log.error("Patient profile NOT FOUND for patientId: {}", patientId);
                return List.of();
            }
            if (patientDto.getUserId() == null) {
                log.error("Patient found ({} {}) but userId (UUID) is NULL. Cannot deliver notification.", 
                    patientDto.getFirstName(), patientDto.getLastName());
                return List.of();
            }

            log.info("Resolved patient profile: {} {} (userId: {})", 
                patientDto.getFirstName(), patientDto.getLastName(), patientDto.getUserId());
            return List.of(new NotificationDelivery(notification, patientDto.getUserId()));
        } catch (Exception e) {
            log.error("Failed to fetch patient info via CareClient: {}", e.getMessage());
            return List.of();
        }
    }

    public List<Notification> chatMessageNotificationMapper(GenericEvent event) {
        Notification notification = new Notification();
        Map<String, Object> payload = event.getPayload();
        
        String senderFullName = (String) payload.getOrDefault("senderFullName", "Someone");
        String content = (String) payload.getOrDefault("content", "sent you a message.");
        Object messageIdObj = payload.get("messageId");
        if (messageIdObj instanceof Number) {
            notification.setReferenceId(((Number) messageIdObj).longValue());
        }
        
        notification.setTitle("New Message from " + senderFullName);
        notification.setMessage(content);
        notification.setEventType(event.getEventType());
        // Leave recipientType and recipientId as neutral/null since dpchat uses UUID strings
        return List.of(notification);
    }

    private List<NotificationDelivery> chatMessageDeliveries(GenericEvent event) {
        List<Notification> notifications = chatMessageNotificationMapper(event);
        if (notifications.isEmpty()) return List.of();
        
        Notification notification = notifications.get(0);
        String recipientIdStr = (String) event.getPayload().get("recipientId");
        UUID recipientUuid = null;
        if (recipientIdStr != null && !recipientIdStr.isEmpty()) {
            try {
                recipientUuid = UUID.fromString(recipientIdStr);
            } catch (Exception ignored) {}
        }
        
        if (recipientUuid == null) {
            return List.of(); // Cannot deliver without a valid recipient ID
        }
        
        return List.of(new NotificationDelivery(notification, recipientUuid));
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
