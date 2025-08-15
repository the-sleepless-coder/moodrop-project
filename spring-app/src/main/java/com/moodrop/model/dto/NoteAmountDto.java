package com.moodrop.model.dto;

import lombok.Getter;

@Getter
public class NoteAmountDto {
    private Long noteId;
    private Double amount;

    public NoteAmountDto(Long noteId, Double amount) {
        this.noteId = noteId;
        this.amount = amount;
    };
}
