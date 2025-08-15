package com.moodrop.model.dto;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardStatsDto {
    private long totalJobs;
    private long completedJobs;
    private int successRate;
    private long totalManufacturingTime;
    private List<MonthlyStat> monthlyStats;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonthlyStat {
        private String month;
        private long jobCount;
    }
}
