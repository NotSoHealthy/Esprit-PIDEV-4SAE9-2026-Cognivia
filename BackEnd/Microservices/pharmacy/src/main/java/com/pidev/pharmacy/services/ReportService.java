package com.pidev.pharmacy.services;

import com.pidev.pharmacy.entities.Pharmacy;
import com.pidev.pharmacy.entities.Report;
import com.pidev.pharmacy.entities.ReportReason;
import com.pidev.pharmacy.repositories.PharmacyRepository;
import com.pidev.pharmacy.repositories.ReportRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
public class ReportService implements IService<Report> {

    private final ReportRepository reportRepository;
    private final PharmacyRepository pharmacyRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Report> getAll() {
        return reportRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Report getById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found with id: " + id));
    }

    @Override
    @Transactional
    public Report create(Report entity) {
        entity.setId(null);
        if (entity.getReason() == null) {
            throw new RuntimeException("Report reason is required");
        }
        Pharmacy pharmacy = pharmacyRepository.findById(entity.getPharmacy().getId())
                .orElseThrow(() -> new RuntimeException("Pharmacy not found with id: " + entity.getPharmacy().getId()));
        entity.setPharmacy(pharmacy);
        return reportRepository.save(entity);
    }

    @Override
    @Transactional
    public Report update(Long id, Report entity) {
        Report existing = getById(id);
        if (entity.getReason() != null) {
            existing.setReason(entity.getReason());
        }
        if (entity.getDescription() != null) {
            existing.setDescription(entity.getDescription());
        }
        return reportRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        reportRepository.delete(getById(id));
    }

    @Transactional(readOnly = true)
    public List<Report> getByPharmacy(Long pharmacyId) {
        return reportRepository.findByPharmacyId(pharmacyId);
    }

    @Transactional(readOnly = true)
    public List<Report> getByReason(ReportReason reason) {
        return reportRepository.findByReason(reason);
    }
}

