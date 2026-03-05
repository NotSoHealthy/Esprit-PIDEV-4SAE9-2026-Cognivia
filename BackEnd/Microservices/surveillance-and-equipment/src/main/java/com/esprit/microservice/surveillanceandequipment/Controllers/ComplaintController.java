package com.esprit.microservice.surveillanceandequipment.Controllers;


import com.esprit.microservice.surveillanceandequipment.Entities.Complaint;
import com.esprit.microservice.surveillanceandequipment.Services.ComplaintService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/complaint")
@AllArgsConstructor
public class ComplaintController {
    public final ComplaintService complaintService;

    @GetMapping
    public List<Complaint> getAllComplaints() {
        return complaintService.getAllComplaints();
    }

    @GetMapping("/patient/{patientId}")
    public List<Complaint> getComplaintsByPatientId(@PathVariable Long patientId) {
        return complaintService.getAllComplaintsByPatientId(patientId);
    }

    @PostMapping("/submit")
    public Complaint submitComplaint(@RequestBody Complaint complaint) {
        return complaintService.createComplaint(complaint);
    }

    @PutMapping("/validate")
    public Complaint validateComplaint(@RequestBody Complaint complaint) {
        return complaintService.validateComplaint(complaint);
    }

    @PutMapping("/dismiss")
    public Complaint dismissComplaint(@RequestBody Complaint complaint) {
        return complaintService.dismissComplaint(complaint);
    }

    @PutMapping("/appeal")
    public Complaint appealComplaint(@RequestBody Complaint complaint) {
        return complaintService.appealComplaint(complaint);
    }

    @PutMapping("/close")
    public Complaint closeComplaint(@RequestBody Complaint complaint) {
        return complaintService.closeComplaint(complaint);
    }

    @PutMapping("/investigate")
    public Complaint startInvestigation(@RequestBody Complaint complaint) {
        return complaintService.startInvestigation(complaint);
    }

    @PutMapping("/take-action")
    public Complaint takeAction(@RequestBody Complaint complaint) {
        return complaintService.takeAction(complaint);
    }

    @DeleteMapping("/{id}")
    public void deleteComplaint(@PathVariable Long id) {
        complaintService.deleteComplaint(id);
    }

    @PutMapping("/whiteboard")
    public Complaint saveWhiteboard(@RequestBody Complaint complaint){
        return complaintService.saveWhiteboard(complaint);
    }
}
