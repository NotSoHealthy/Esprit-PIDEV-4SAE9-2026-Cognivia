package com.esprit.microservice.appointmentservice.dto.ai;

import java.util.List;

public class DoctorFreeSlots {

    private String name;
    private String specialty;
    private List<DaySlots> freeSlots;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public List<DaySlots> getFreeSlots() { return freeSlots; }
    public void setFreeSlots(List<DaySlots> freeSlots) { this.freeSlots = freeSlots; }

    public static class DaySlots {
        private String date;
        private List<String> times;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public List<String> getTimes() { return times; }
        public void setTimes(List<String> times) { this.times = times; }
    }
}
