package com.pidev.monitoring.events;

import static org.junit.jupiter.api.Assertions.*;

import com.pidev.monitoring.entities.VisitReport;
import org.junit.jupiter.api.Test;

class GenericEventGeneratorTest {

    @Test
    void newVisitReportEvent_setsTypeAndPayload() {
        VisitReport report = new VisitReport();
        report.setId(1L);
        report.setVisitId(2L);

        GenericEvent event = GenericEventGenerator.newVisitReportEvent(report);

        assertNotNull(event);
        assertEquals("VISIT_REPORT_SUBMITTED", event.getEventType());
        assertNotNull(event.getPayload());
        assertEquals(1L, event.getPayload().get("reportId"));
        assertEquals(2L, event.getPayload().get("visitId"));
        assertNotNull(event.getOccurredAt());
    }
}
