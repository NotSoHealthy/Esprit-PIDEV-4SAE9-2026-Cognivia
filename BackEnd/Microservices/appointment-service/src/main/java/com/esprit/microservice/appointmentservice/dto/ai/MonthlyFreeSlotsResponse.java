package com.esprit.microservice.appointmentservice.dto.ai;

import java.util.List;

public class MonthlyFreeSlotsResponse {

    private String month;
    private List<DoctorFreeSlots> doctors;

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    public List<DoctorFreeSlots> getDoctors() { return doctors; }
    public void setDoctors(List<DoctorFreeSlots> doctors) { this.doctors = doctors; }
}
