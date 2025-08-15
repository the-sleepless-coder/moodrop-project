package com.moodrop.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.moodrop.mqtt.Ethanol;
import com.moodrop.mqtt.Ingredient;
import lombok.*;

import java.util.List;


public class RequestDto {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequestDto {
        @JsonProperty("ingredients")
        private List<Ingredient> ingredients;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ManufactureRequestDto {
        @JsonProperty("ethanol")
        private Ethanol ethanol;
        @JsonProperty("ingredients")
        private List<Ingredient> ingredients;
        
    }
}
