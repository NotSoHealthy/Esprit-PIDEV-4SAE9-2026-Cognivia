package com.esprit.microservice.appointmentservice.dto.ai;

import java.util.List;

public class FreeSlotsRequest {

    private List<DoctorInfo> doctors;

    public List<DoctorInfo> getDoctors() { return doctors; }
    public void setDoctors(List<DoctorInfo> doctors) { this.doctors = doctors; }

    public static class DoctorInfo {
        private Long id;
        private String name;
        private String specialty;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSpecialty() { return specialty; }
        public void setSpecialty(String specialty) { this.specialty = specialty; }
    }
}
