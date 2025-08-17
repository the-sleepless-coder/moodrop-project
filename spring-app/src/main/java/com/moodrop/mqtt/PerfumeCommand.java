package com.moodrop.mqtt;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.moodrop.model.enums.MachineStatus;
import com.moodrop.model.enums.RequestCMDType;
import com.moodrop.model.enums.ResponseCMDType;
import jakarta.annotation.Nullable;
import lombok.*;

import java.util.List;

public class PerfumeCommand {

    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PerfumeCommandRequest {
        @JsonProperty("CMD")
        private RequestCMDType cmd;

        @Nullable
        @JsonProperty("ethanol")
        private Ethanol ethanol;

        @JsonProperty("data")
        private Object data;

        public static PerfumeCommandRequest manufacture(List<PerfumeData.PerfumeDataInput> inputs, Ethanol ethanol) {
            List<PerfumeData.ManufactureItemRequest> payload =
                    PerfumeData.PerfumeDataInput.toManufactureList(inputs);
            return PerfumeCommandRequest.builder()
                    .cmd(RequestCMDType.manufacture)
                    .data(payload)
                    .ethanol(ethanol)
                    .build();
        }

        public static PerfumeCommandRequest update(List<PerfumeData.PerfumeDataInput> inputs) {
            List<PerfumeData.UpdateItemRequest> payload =
                    PerfumeData.PerfumeDataInput.toUpdateList(inputs);
            return PerfumeCommandRequest.builder()
                    .cmd(RequestCMDType.update)
                    .data(payload)
                    .build();
        }

        public static PerfumeCommandRequest check() {
            return PerfumeCommandRequest.builder()
                    .cmd(RequestCMDType.check)
                    .build();
        }

        public static PerfumeCommandRequest connect() {
            return PerfumeCommandRequest.builder()
                    .cmd(RequestCMDType.connect)
                    .build();
        }
    }

    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PerfumeCommandResponse {
        @JsonProperty("CMD")
        private ResponseCMDType cmd;

        @JsonProperty("data")
        private Object data;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class SimpleStatus {
            private ResponseCMDType status;
        }

        public static PerfumeCommandResponse connect() {
            return PerfumeCommandResponse.builder()
                    .cmd(ResponseCMDType.connect)
                    .build();
        }

        public static PerfumeCommandResponse status(MachineStatus status) {
            return PerfumeCommandResponse.builder()
                    .cmd(ResponseCMDType.status)
                    .data(status)
                    .build();
        }

        public static PerfumeCommandResponse check(List<PerfumeData.UpdateItemRequest> items) {
            return PerfumeCommandResponse.builder()
                    .cmd(ResponseCMDType.check)
                    .data(items)
                    .build();
        }

        public static PerfumeCommandResponse update(ResponseCMDType status) {
            return PerfumeCommandResponse.builder()
                    .cmd(ResponseCMDType.update)
                    .data(status)
                    .build();
        }
    }
}
