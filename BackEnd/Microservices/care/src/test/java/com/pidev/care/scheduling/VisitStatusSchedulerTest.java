package com.pidev.care.scheduling;

import com.pidev.care.entities.VisitStatus;
import com.pidev.care.repositories.VisitRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class VisitStatusSchedulerTest {

    @Mock
    private VisitRepository visitRepository;

    @InjectMocks
    private VisitStatusScheduler scheduler;

    @Captor
    private ArgumentCaptor<LocalDate> dateCaptor;

    @Test
    void markPastScheduledAsMissed_delegatesToRepository() {
        scheduler.markPastScheduledAsMissed();

        verify(visitRepository).markMissedForPastScheduled(
                dateCaptor.capture(),
                org.mockito.ArgumentMatchers.eq(VisitStatus.SCHEDULED),
                org.mockito.ArgumentMatchers.eq(VisitStatus.MISSED));

        assertThat(dateCaptor.getValue()).isEqualTo(LocalDate.now());
    }
}
