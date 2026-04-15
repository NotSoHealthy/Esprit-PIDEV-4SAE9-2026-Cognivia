package com.pidev.notifications.rabbitMQ;

import com.pidev.notifications.dto.CaregiverDto;
import com.pidev.notifications.dto.DoctorDto;
import com.pidev.notifications.dto.PatientDto;
import com.pidev.notifications.dto.VisitDto;
import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.RecipientType;
import com.pidev.notifications.events.GenericEvent;
import com.pidev.notifications.openFeign.CareClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationMapperTest {

    @Mock
    private CareClient careClient;

    @InjectMocks
    private NotificationMapper notificationMapper;

    @Test
    void fromEventDeliveries_visitReportSubmitted_mapsSingleDelivery() {
        long reportId = 55L;
        long visitId = 10L;
        long caregiverId = 7L;
        long patientId = 8L;
        long doctorId = 9L;
        UUID doctorUserId = UUID.randomUUID();

        GenericEvent event = new GenericEvent("VISIT_REPORT_SUBMITTED", Map.of(
                "reportId", reportId,
                "visitId", visitId));

        VisitDto visitDto = new VisitDto(visitId, "DONE", LocalDate.of(2026, 1, 1), null, caregiverId, patientId,
                doctorId);
        PatientDto patientDto = new PatientDto(patientId, UUID.randomUUID(), "Jane", "Doe", null, null, null, null,
                null, null);
        CaregiverDto caregiverDto = new CaregiverDto(caregiverId, UUID.randomUUID(), "John", "Smith", null, null,
                null);
        DoctorDto doctorDto = new DoctorDto(doctorId, doctorUserId, "Doc", "Tor", null, null, null, null);

        when(careClient.getVisitById(eq(visitId))).thenReturn(visitDto);
        when(careClient.getPatientById(eq(patientId))).thenReturn(patientDto);
        when(careClient.getCaregiverById(eq(caregiverId))).thenReturn(caregiverDto);
        when(careClient.getDoctorById(eq(doctorId))).thenReturn(doctorDto);

        List<NotificationMapper.NotificationDelivery> deliveries = notificationMapper.fromEventDeliveries(event);

        assertThat(deliveries).hasSize(1);
        NotificationMapper.NotificationDelivery delivery = deliveries.getFirst();

        assertThat(delivery.recipientUserId()).isEqualTo(doctorUserId);
        Notification notification = delivery.notification();
        assertThat(notification.getRecipientId()).isEqualTo(doctorId);
        assertThat(notification.getRecipientType()).isEqualTo(RecipientType.DOCTOR);
        assertThat(notification.getTitle()).isEqualTo("New Visit Report Submitted");
        assertThat(notification.getEventType()).isEqualTo("VISIT_REPORT_SUBMITTED");
        assertThat(notification.getReferenceId()).isEqualTo(visitId);
        assertThat(notification.getMessage())
                .contains("John Smith")
                .contains("Jane Doe");

        verify(careClient).getVisitById(eq(visitId));
        verify(careClient).getPatientById(eq(patientId));
        verify(careClient).getCaregiverById(eq(caregiverId));
        verify(careClient).getDoctorById(eq(doctorId));
        verifyNoMoreInteractions(careClient);
    }

    @Test
    void fromEvent_visitScheduled_mapsTwoNotifications() {
        long visitId = 101L;
        long caregiverId = 201L;
        long patientId = 301L;
        long doctorId = 401L;

        GenericEvent event = new GenericEvent("VISIT_SCHEDULED", Map.of(
                "visitId", visitId));

        VisitDto visitDto = new VisitDto(visitId, "SCHEDULED", LocalDate.of(2026, 2, 3), null, caregiverId, patientId,
                doctorId);
        PatientDto patientDto = new PatientDto(patientId, UUID.randomUUID(), "Alice", "Patient", null, null, null, null,
                null, null);
        CaregiverDto caregiverDto = new CaregiverDto(caregiverId, UUID.randomUUID(), "Bob", "Care", null, null, null);

        when(careClient.getVisitById(eq(visitId))).thenReturn(visitDto);
        when(careClient.getPatientById(eq(patientId))).thenReturn(patientDto);
        when(careClient.getCaregiverById(eq(caregiverId))).thenReturn(caregiverDto);

        List<Notification> notifications = notificationMapper.fromEvent(event);

        assertThat(notifications).hasSize(2);

        Notification caregiverNotification = notifications.stream()
                .filter(n -> RecipientType.CAREGIVER.equals(n.getRecipientType()))
                .findFirst()
                .orElseThrow();
        Notification patientNotification = notifications.stream()
                .filter(n -> RecipientType.PATIENT.equals(n.getRecipientType()))
                .findFirst()
                .orElseThrow();

        assertThat(caregiverNotification.getRecipientId()).isEqualTo(caregiverId);
        assertThat(caregiverNotification.getTitle()).isEqualTo("New Visit Scheduled");
        assertThat(caregiverNotification.getEventType()).isEqualTo("VISIT_SCHEDULED");
        assertThat(caregiverNotification.getReferenceId()).isEqualTo(visitId);
        assertThat(caregiverNotification.getMessage())
                .contains("Alice Patient")
                .contains("2026-02-03");

        assertThat(patientNotification.getRecipientId()).isEqualTo(patientId);
        assertThat(patientNotification.getTitle()).isEqualTo("New Visit Scheduled");
        assertThat(patientNotification.getEventType()).isEqualTo("VISIT_SCHEDULED");
        assertThat(patientNotification.getReferenceId()).isEqualTo(visitId);
        assertThat(patientNotification.getMessage())
                .contains("Bob Care")
                .contains("2026-02-03");

        verify(careClient).getVisitById(eq(visitId));
        verify(careClient).getPatientById(eq(patientId));
        verify(careClient).getCaregiverById(eq(caregiverId));
        verifyNoMoreInteractions(careClient);
    }

    @Test
    void fromEventDeliveries_visitScheduled_mapsTwoDeliveries() {
        long visitId = 1000L;
        long caregiverId = 2000L;
        long patientId = 3000L;
        long doctorId = 4000L;
        UUID caregiverUserId = UUID.randomUUID();
        UUID patientUserId = UUID.randomUUID();

        GenericEvent event = new GenericEvent("VISIT_SCHEDULED", Map.of(
                "visitId", visitId));

        VisitDto visitDto = new VisitDto(visitId, "SCHEDULED", LocalDate.of(2026, 3, 4), null, caregiverId, patientId,
                doctorId);
        PatientDto patientDto = new PatientDto(patientId, patientUserId, "Pat", "Ent", null, null, null, null, null,
                null);
        CaregiverDto caregiverDto = new CaregiverDto(caregiverId, caregiverUserId, "Care", "Giver", null, null, null);

        when(careClient.getVisitById(eq(visitId))).thenReturn(visitDto);
        when(careClient.getPatientById(eq(patientId))).thenReturn(patientDto);
        when(careClient.getCaregiverById(eq(caregiverId))).thenReturn(caregiverDto);

        List<NotificationMapper.NotificationDelivery> deliveries = notificationMapper.fromEventDeliveries(event);

        assertThat(deliveries).hasSize(2);

        assertThat(deliveries)
                .anySatisfy(d -> {
                    assertThat(d.recipientUserId()).isEqualTo(caregiverUserId);
                    assertThat(d.notification().getRecipientType()).isEqualTo(RecipientType.CAREGIVER);
                    assertThat(d.notification().getRecipientId()).isEqualTo(caregiverId);
                })
                .anySatisfy(d -> {
                    assertThat(d.recipientUserId()).isEqualTo(patientUserId);
                    assertThat(d.notification().getRecipientType()).isEqualTo(RecipientType.PATIENT);
                    assertThat(d.notification().getRecipientId()).isEqualTo(patientId);
                });

        verify(careClient).getVisitById(eq(visitId));
        verify(careClient).getPatientById(eq(patientId));
        verify(careClient).getCaregiverById(eq(caregiverId));
        verifyNoMoreInteractions(careClient);
    }

    @Test
    void fromEventDeliveries_unsupportedEventType_throws() {
        GenericEvent event = new GenericEvent("UNKNOWN", Map.of());

        assertThatThrownBy(() -> notificationMapper.fromEventDeliveries(event))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported event type: UNKNOWN");

        verifyNoInteractions(careClient);
    }

    @Test
    void fromEventDeliveries_missingPayloadField_throws() {
        GenericEvent event = new GenericEvent("VISIT_SCHEDULED", Map.of());

        assertThatThrownBy(() -> notificationMapper.fromEventDeliveries(event))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Missing payload field: visitId");

        verifyNoInteractions(careClient);
    }

    @Test
    void fromEventDeliveries_payloadFieldAsString_parses() {
        long visitId = 12L;
        long caregiverId = 1L;
        long patientId = 2L;
        long doctorId = 3L;
        UUID caregiverUserId = UUID.randomUUID();
        UUID patientUserId = UUID.randomUUID();

        GenericEvent event = new GenericEvent("VISIT_SCHEDULED", Map.of(
                "visitId", String.valueOf(visitId)));

        VisitDto visitDto = new VisitDto(visitId, "SCHEDULED", LocalDate.of(2026, 4, 5), null, caregiverId, patientId,
                doctorId);
        PatientDto patientDto = new PatientDto(patientId, patientUserId, "A", "B", null, null, null, null, null, null);
        CaregiverDto caregiverDto = new CaregiverDto(caregiverId, caregiverUserId, "C", "D", null, null, null);

        when(careClient.getVisitById(eq(visitId))).thenReturn(visitDto);
        when(careClient.getPatientById(eq(patientId))).thenReturn(patientDto);
        when(careClient.getCaregiverById(eq(caregiverId))).thenReturn(caregiverDto);

        List<NotificationMapper.NotificationDelivery> deliveries = notificationMapper.fromEventDeliveries(event);

        assertThat(deliveries).hasSize(2);
        verify(careClient).getVisitById(eq(visitId));
        verify(careClient).getPatientById(eq(patientId));
        verify(careClient).getCaregiverById(eq(caregiverId));
        verifyNoMoreInteractions(careClient);
    }

    @Test
    void fromEventDeliveries_payloadFieldNonNumericString_throws() {
        GenericEvent event = new GenericEvent("VISIT_SCHEDULED", Map.of(
                "visitId", "abc"));

        assertThatThrownBy(() -> notificationMapper.fromEventDeliveries(event))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid numeric payload field: visitId=abc");

        verifyNoInteractions(careClient);
    }

    @Test
    void fromEventDeliveries_payloadFieldUnsupportedType_throws() {
        GenericEvent event = new GenericEvent("VISIT_SCHEDULED", Map.of(
                "visitId", new Object()));

        assertThatThrownBy(() -> notificationMapper.fromEventDeliveries(event))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported payload type for visitId");

        verifyNoInteractions(careClient);
    }
}
