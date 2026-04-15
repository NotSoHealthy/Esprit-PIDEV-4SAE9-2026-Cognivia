package com.pidev.care.events;

import com.pidev.care.entities.Visit;

import java.util.Map;

public class GenericEventGenerator {
    public static GenericEvent newVisitEvent(Visit visit) {
        GenericEvent event = new GenericEvent();
        event.setEventType("VISIT_SCHEDULED");
        event.setPayload(Map.of(
                "visitId", visit.getId()
        ));
        return event;
    }
}
