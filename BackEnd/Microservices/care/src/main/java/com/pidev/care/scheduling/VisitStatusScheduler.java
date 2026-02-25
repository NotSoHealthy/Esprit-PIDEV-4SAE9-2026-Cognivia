package com.pidev.care.scheduling;

import com.pidev.care.entities.VisitStatus;
import com.pidev.care.repositories.VisitRepository;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class VisitStatusScheduler {

    private final VisitRepository visitRepository;

    public VisitStatusScheduler(VisitRepository visitRepository) {
        this.visitRepository = visitRepository;
    }

    @Transactional
    @Scheduled(cron = "0 5 0 * * *")
    public void markPastScheduledAsMissed() {
        visitRepository.markMissedForPastScheduled(
                LocalDate.now(),
                VisitStatus.SCHEDULED,
                VisitStatus.MISSED
        );
    }
}
