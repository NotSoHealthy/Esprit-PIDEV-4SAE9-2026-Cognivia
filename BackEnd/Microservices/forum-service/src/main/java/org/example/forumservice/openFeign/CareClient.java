package org.example.forumservice.openFeign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;
import java.util.UUID;

@FeignClient(name = "care")
public interface CareClient {

    @GetMapping("/doctor/user/{userId}")
    String getDoctorByUserId(@PathVariable("userId") UUID userId);

    @GetMapping("/caregiver/user/{userId}")
    String getCaregiverByUserId(@PathVariable("userId") UUID userId);

    @GetMapping("/patient/user/{userId}")
    String getPatientByUserId(@PathVariable("userId") UUID userId);
}
