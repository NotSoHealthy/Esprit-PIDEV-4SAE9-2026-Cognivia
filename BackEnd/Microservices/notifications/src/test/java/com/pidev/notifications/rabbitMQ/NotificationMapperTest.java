package com.pidev.notifications.rabbitMQ;

import com.pidev.notifications.dto.VisitDto;
import com.pidev.notifications.entities.Notification;
import com.pidev.notifications.entities.RecipientType;
import com.pidev.notifications.events.GenericEvent;
import com.pidev.notifications.openFeign.CareClient;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationMapperTest {

    @Test
    void fromEvent_acceptsIntegerPayloadNumbers() {
        CareClient careClient = mock(CareClient.class);
        NotificationMapper mapper = new NotificationMapper(careClient);

        VisitDto visitDto = new VisitDto();
        visitDto.setDoctorId(99L);
        when(careClient.getVisitById(12L)).thenReturn(visitDto);

        GenericEvent event = new GenericEvent(
                "VISIT_REPORT_SUBMITTED",
                Map.of("reportId", 7, "visitId", 12)
        );

        Notification notification = mapper.fromEvent(event);

        assertEquals(99L, notification.getRecipientId());
        assertEquals(RecipientType.DOCTOR, notification.getRecipientType());
        assertEquals("VISIT_REPORT_SUBMITTED", notification.getEventType());
        assertEquals(7L, notification.getReferenceId());
        verify(careClient).getVisitById(12L);
    }

    @Test
    void fromEvent_throwsForNonNumericPayloadValue() {
        CareClient careClient = mock(CareClient.class);
        NotificationMapper mapper = new NotificationMapper(careClient);

        GenericEvent event = new GenericEvent(
                "VISIT_REPORT_SUBMITTED",
                Map.of("reportId", "abc", "visitId", 12)
        );

        assertThrows(IllegalArgumentException.class, () -> mapper.fromEvent(event));
    }
}

