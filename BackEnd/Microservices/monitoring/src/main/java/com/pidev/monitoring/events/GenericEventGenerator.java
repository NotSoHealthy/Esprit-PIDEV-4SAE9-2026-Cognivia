package com.pidev.monitoring.events;

import com.pidev.monitoring.entities.ReportStatus;
import com.pidev.monitoring.entities.VisitReport;

import java.util.Map;

public class GenericEventGenerator {
    public static GenericEvent newVisitReportEvent(VisitReport report) {
        GenericEvent event = new GenericEvent();
        event.setEventType("VISIT_REPORT_CREATED");
        event.setPayload(Map.of(
                "reportId", report.getId(),
                "visitId", report.getVisitId()
        ));
        return event;
    }
}
