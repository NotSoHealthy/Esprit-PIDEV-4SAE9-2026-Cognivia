package com.pidev.monitoring.services;

import com.pidev.monitoring.entities.ReportStatus;
import com.pidev.monitoring.entities.VisitReport;
import com.pidev.monitoring.events.GenericEventGenerator;
import com.pidev.monitoring.rabbitMQ.EventPublisher;
import com.pidev.monitoring.repositories.VisitReportRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Service
@AllArgsConstructor
public class VisitReportService implements IService<VisitReport> {
    private final VisitReportRepository visitReportRepository;
    private final EventPublisher eventPublisher;

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
        VisitReport saved = visitReportRepository.save(entity);
        if (saved.getStatus() == ReportStatus.VALIDATED) {
            eventPublisher.sendGenericEvent(
                    GenericEventGenerator.newVisitReportEvent(saved),
                    "visit_report.validated"
            );
        }
        return saved;
    }

    @Override
    public VisitReport update(Long id, VisitReport entity) {
        VisitReport existing = visitReportRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Visit report not found");
        }

        existing.setContent(entity.getContent());
        existing.setStatus(entity.getStatus());

        VisitReport saved = visitReportRepository.save(existing);
        if (saved.getStatus() == ReportStatus.VALIDATED) {
            eventPublisher.sendGenericEvent(
                    GenericEventGenerator.newVisitReportEvent(saved),
                    "visit_report.validated"
            );
        }
        return saved;
    }

    @Override
    public void delete(Long id) {
        visitReportRepository.deleteById(id);
    }

    public VisitReport getByVisitId(Long visitId) {
        return visitReportRepository.findByVisitId(visitId).orElse(null);
    }
}
