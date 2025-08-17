package com.moodrop.mqtt;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.Nullable;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Ingredient {

    // 요청 또는 응답에서 비울 수 있으니 래퍼 사용
    @Nullable
    @JsonProperty("slotId")
    private Long slotId;

    // 요청(JSON)에서 들어오는 noteId
    @Nullable
    @JsonProperty("ingredientId")
    private Long noteId;

    // update용(ml) — 요청(JSON) 키: amount
    @Nullable
    @JsonProperty("amount")
    private Double capacity;

    // manufacture용(%) — 요청(JSON) 키: prop
    @Nullable
    @JsonProperty("prop")
    private Long prop;

    // 사람이 읽는 이름
    @Nullable
    @JsonProperty("name")
    private String noteName;

    // 응답에서 쓰는 현재 용량(ml)
    @Nullable
    @JsonProperty("currentAmount")
    private Double currentAmount;

    public Ingredient(Long slotId, Long noteId, String name, Double newAmount) {
        this.slotId = slotId;
        this.noteId = noteId;
        this.noteName = name;
        this.currentAmount = newAmount;
    }
}
