package com.pidev.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaregiverReportDTO {
    private Long patientId;
    private String patientName;
    private Integer currentRiskValue;
    private String riskLevel;
    private String clinicalSummary;
    private List<TestScoreDetail> recentScores;
    private ExternalGameMetrics unityMetrics;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestScoreDetail {
        private String testName;
        private Double score;
        private String date;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExternalGameMetrics {
        private Double avgResponseTime;
        private Integer sessionsCompleted;
        private String performanceTrend;
    }
}
