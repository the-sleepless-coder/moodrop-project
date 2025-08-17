package com.moodrop.mqtt;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;
import java.util.stream.Collectors;

public class PerfumeData {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PerfumeDataInput {
        // update 용
        @JsonProperty("SlotId")
        private Long slotId;

        @JsonProperty("name")
        private String name;

        @JsonProperty("capacity")
        private Double capacity;

        // manufacture 용
        @JsonProperty("prop")
        private Long prop;

        public static List<UpdateItemRequest> toUpdateList(List<PerfumeDataInput> inputs) {
            return inputs.stream()
                    .map(i -> UpdateItemRequest.builder()
                            .slotId(i.getSlotId())
                            .capacity(i.getCapacity())
                            .build())
                    .collect(Collectors.toList());
        }

        public static List<ManufactureItemRequest> toManufactureList(List<PerfumeDataInput> inputs) {
            return inputs.stream()
                    .map(i -> ManufactureItemRequest.builder()
                            .slotId(i.getSlotId() == null ? 0 : i.getSlotId())
                            .prop((long) (i.getProp() == null ? 0 : i.getProp()))
                            .build())
                    .collect(Collectors.toList());
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ManufactureItemRequest {
        @JsonProperty("SlotId")
        private Long slotId;

        @JsonProperty("prop")
        private Long prop;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateItemRequest {
        @JsonProperty("SlotId")
        private Long slotId;

        @JsonProperty("capacity")
        private Double capacity;
    }
}
