package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.JournalEntry;
import com.pidev.monitoring.entities.VisitReport;
import com.pidev.monitoring.repositories.JournalEntryRepository;
import com.pidev.monitoring.repositories.VisitReportRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class JournalEntryService implements IService<JournalEntry> {
    private final JournalEntryRepository journalEntryRepository;

    @Override
    public List<JournalEntry> getAll() {
        return journalEntryRepository.findAll();
    }

    @Override
    public JournalEntry getById(Long id) {
        return journalEntryRepository.findById(id).orElse(null);
    }

    @Override
    public JournalEntry create(JournalEntry entity) {
        return journalEntryRepository.save(entity);
    }

    @Override
    public JournalEntry update(Long id, JournalEntry entity) {
        JournalEntry existing = journalEntryRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Journal entry not found");
        }

        existing.setTitle(entity.getTitle());
        existing.setContent(entity.getContent());

        return journalEntryRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        journalEntryRepository.deleteById(id);
    }

    public List<JournalEntry> getByPatientId(Long patientId) {
        return journalEntryRepository.findByPatientId(patientId);
    }
}
