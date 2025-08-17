package com.moodrop.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.moodrop.model.enums.MachineStatus;
import com.moodrop.model.enums.ResponseCMDType;
import com.moodrop.mqtt.Ingredient;
import jakarta.annotation.Nullable;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class ResponseDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdateResponseDto {
        private boolean success;
        private UpdateData data;
        @Getter @Setter @NoArgsConstructor @AllArgsConstructor
        public static class UpdateData {
            private List<Ingredient> ingredients;
            @JsonProperty("lastUpdated")
            private LocalDateTime lastUpdated;
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ManufactureResponseDto {
        private boolean success;
        private ManufactureData data;
        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class ManufactureData {
            private String jobId;
            private String status;
            private LocalDateTime startedAt;
            @Nullable private LocalDateTime estimatedCompletion;
            @Nullable private CurrentStage currentStage;
            @Getter @Setter @NoArgsConstructor @AllArgsConstructor
            public static class CurrentStage {
                private String name;
                private String displayName;
                private Long progress;
            }
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CheckResponseDto {
        private boolean success;
        private CheckData data;
        @Getter @Setter @NoArgsConstructor @AllArgsConstructor
        public static class CheckData {
            @Nullable private String deviceId;
            @Nullable private Long totalSlots;
            private List<Ingredient> ingredients;
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class StatusResponseDto {
        private boolean success;
        private StatusData data;
        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class StatusData {
            @Nullable private String deviceId;
            private String name;
            @JsonProperty("operationalStatus")
            private MachineStatus machineStatus;
            @Nullable private Long currentJob;
            private LocalDateTime lastActivity;
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ConnectResponseDto {
        private boolean success;
        private ConnectData data;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class ConnectData {
            private String deviceId;

            @JsonProperty("operationalStatus")
            private ResponseCMDType responseCMDType;

            private String status;
        }
    }
}
