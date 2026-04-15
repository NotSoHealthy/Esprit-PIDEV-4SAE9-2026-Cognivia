package com.pidev.notifications.openFeign;

import com.pidev.notifications.dto.CaregiverDto;
import com.pidev.notifications.dto.DoctorDto;
import com.pidev.notifications.dto.PatientDto;
import com.pidev.notifications.dto.VisitDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "care")
public interface CareClient {

    @GetMapping("/visit/dto/{id}")
    VisitDto getVisitById(@PathVariable Long id);

    @GetMapping("/patient/dto/{id}")
    PatientDto getPatientById(@PathVariable Long id);

    @GetMapping("/doctor/dto/{id}")
    DoctorDto getDoctorById(@PathVariable Long id);

    @GetMapping("/caregiver/dto/{id}")
    CaregiverDto getCaregiverById(@PathVariable Long id);
}
