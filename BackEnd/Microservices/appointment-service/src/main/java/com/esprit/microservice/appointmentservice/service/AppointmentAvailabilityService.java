package com.esprit.microservice.appointmentservice.service;

import com.esprit.microservice.appointmentservice.dto.ai.DoctorFreeSlots;
import com.esprit.microservice.appointmentservice.dto.ai.FreeSlotsRequest;
import com.esprit.microservice.appointmentservice.dto.ai.MonthlyFreeSlotsResponse;
import com.esprit.microservice.appointmentservice.entity.Appointment;
import com.esprit.microservice.appointmentservice.entity.AppointmentStatus;
import com.esprit.microservice.appointmentservice.repository.AppointmentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AppointmentAvailabilityService {

    private final AppointmentRepository repository;
    private final DeepSeekService deepSeekService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AppointmentAvailabilityService(AppointmentRepository repository, DeepSeekService deepSeekService) {
        this.repository = repository;
        this.deepSeekService = deepSeekService;
    }

    public MonthlyFreeSlotsResponse getMonthlyFreeSlots(List<FreeSlotsRequest.DoctorInfo> doctors) {
        YearMonth currentMonth = YearMonth.now();
        String month = currentMonth.toString();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        // Convert stored UTC times to local time using the server's timezone
        ZoneId zone = ZoneId.systemDefault();

        List<Appointment> booked = repository.findAll().stream()
                .filter(a -> {
                    if (a.getAppointmentDate() == null) return false;
                    LocalDate date = a.getAppointmentDate().atZoneSameInstant(zone).toLocalDate();
                    return !date.isBefore(startOfMonth) && !date.isAfter(endOfMonth)
                            && a.getStatus() != AppointmentStatus.CANCELLED
                            && a.getStatus() != AppointmentStatus.COMPLETED;
                })
                .toList();

        // doctorId → name, for building the prompt
        Map<Long, String> idToName = new HashMap<>();
        for (FreeSlotsRequest.DoctorInfo d : doctors) {
            idToName.put(d.getId(), d.getName());
        }

        // doctorId → Set<"YYYY-MM-DD|HHMM"> in LOCAL time, for post-processing
        Map<Long, Set<String>> bookedByDoctorId = new HashMap<>();
        for (Appointment a : booked) {
            ZonedDateTime local = a.getAppointmentDate().atZoneSameInstant(zone);
            String key = local.toLocalDate() + "|"
                    + String.format("%02d%02d", local.getHour(), local.getMinute());
            bookedByDoctorId.computeIfAbsent(a.getDoctorId(), k -> new HashSet<>()).add(key);
        }

        // Build the booked list for the AI prompt, keyed by doctor name
        List<Map<String, Object>> bookedForPrompt = booked.stream()
                .map(a -> {
                    ZonedDateTime local = a.getAppointmentDate().atZoneSameInstant(zone);
                    String name = idToName.getOrDefault(a.getDoctorId(), "Doctor #" + a.getDoctorId());
                    return Map.<String, Object>of(
                            "doctorName", name,
                            "date", local.toLocalDate().toString(),
                            "time", String.format("%02d%02d", local.getHour(), local.getMinute())
                    );
                })
                .toList();

        String bookedJson;
        try {
            bookedJson = objectMapper.writeValueAsString(bookedForPrompt);
        } catch (Exception e) {
            bookedJson = "[]";
        }

        // Step 1: AI generates the slots
        MonthlyFreeSlotsResponse aiResponse = deepSeekService.generateFreeSlots(month, doctors, bookedJson);

        // Step 2: post-process — strip any booked slot the AI incorrectly included
        if (aiResponse.getDoctors() != null) {
            for (DoctorFreeSlots doctorSlots : aiResponse.getDoctors()) {
                Long doctorId = doctors.stream()
                        .filter(d -> d.getName().equalsIgnoreCase(doctorSlots.getName()))
                        .map(FreeSlotsRequest.DoctorInfo::getId)
                        .findFirst().orElse(null);

                if (doctorId == null || doctorSlots.getFreeSlots() == null) continue;
                Set<String> doctorBooked = bookedByDoctorId.getOrDefault(doctorId, Set.of());

                for (DoctorFreeSlots.DaySlots day : doctorSlots.getFreeSlots()) {
                    if (day.getTimes() == null) continue;
                    day.setTimes(day.getTimes().stream()
                            .filter(t -> {
                                // Accept both "09:00" and "0900" from the AI
                                String normalised = t.replace(":", "");
                                return !doctorBooked.contains(day.getDate() + "|" + normalised);
                            })
                            .collect(Collectors.toList()));
                }

                // Drop days that have no free times after filtering
                doctorSlots.setFreeSlots(doctorSlots.getFreeSlots().stream()
                        .filter(day -> day.getTimes() != null && !day.getTimes().isEmpty())
                        .collect(Collectors.toList()));
            }
        }

        return aiResponse;
    }
}
