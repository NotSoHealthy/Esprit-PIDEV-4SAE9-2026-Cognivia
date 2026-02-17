package com.pidev.monitoring.controllers;

import com.pidev.monitoring.entities.JournalEntry;
import com.pidev.monitoring.services.JournalEntryService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/journal-entries")
@AllArgsConstructor
public class JournalEntryController {
    private final JournalEntryService journalEntryService;

    @GetMapping
    public List<JournalEntry> getAllJournalEntries() {
        return journalEntryService.getAll();
    }

    @GetMapping("/{id}")
    public JournalEntry getJournalEntryById(@PathVariable Long id) {
        return journalEntryService.getById(id);
    }

    @GetMapping(params = "patientId")
    public List<JournalEntry> getJournalEntriesByPatientId(@RequestParam Long patientId) {
        return journalEntryService.getByPatientId(patientId);
    }

    @PostMapping
    public JournalEntry createJournalEntry(@RequestBody JournalEntry journalEntry) {
        return journalEntryService.create(journalEntry);
    }

    @PutMapping("/{id}")
    public JournalEntry updateJournalEntry(@PathVariable Long id, @RequestBody JournalEntry journalEntry) {
        return journalEntryService.update(id, journalEntry);
    }

    @DeleteMapping("/{id}")
    public void deleteJournalEntry(@PathVariable Long id) {
        journalEntryService.delete(id);
    }
}
