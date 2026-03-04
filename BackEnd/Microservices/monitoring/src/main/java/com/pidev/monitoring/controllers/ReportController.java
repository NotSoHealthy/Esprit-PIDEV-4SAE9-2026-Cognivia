package com.pidev.monitoring.controllers;

import com.pidev.monitoring.services.CaregiverReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final CaregiverReportService reportService;

    public ReportController(CaregiverReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/patient/{id}/generate")
    public ResponseEntity<byte[]> generateReport(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        try {
            String signatureBase64 = body.get("signature");
            byte[] pdfContents = reportService.generatePatientReportPdf(id, signatureBase64);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "Caregiver_Report_Patient_" + id + ".pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfContents);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
