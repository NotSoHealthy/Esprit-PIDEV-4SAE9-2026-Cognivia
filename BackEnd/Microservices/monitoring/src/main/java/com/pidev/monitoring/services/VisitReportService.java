package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.VisitReport;
import com.pidev.monitoring.repositories.VisitReportRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class VisitReportService implements IService<VisitReport> {
    private final VisitReportRepository visitReportRepository;

    @Override
    public List<VisitReport> getAll() {
        return visitReportRepository.findAll();
    }

    @Override
    public VisitReport getById(Long id) {
        return visitReportRepository.findById(id).orElse(null);
    }

    @Override
    public VisitReport create(VisitReport entity) {
        return visitReportRepository.save(entity);
    }

    @Override
    public VisitReport update(Long id, VisitReport entity) {
        VisitReport existing = visitReportRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Visit report not found");
        }

        existing.setContent(entity.getContent());

        return visitReportRepository.save(existing);
    }

    @Override
    public void delete(Long id) {
        visitReportRepository.deleteById(id);
    }

    public List<VisitReport> getByVisitId(Long visitId) {
        return visitReportRepository.findByVisitId(visitId);
    }
}
