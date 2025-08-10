package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "accord_note")
public class AccordNote {

    @EmbeddedId
    private AccordNoteId id;

    @MapsId("noteId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "note_id", nullable = false,
            foreignKey = @ForeignKey(name = "accord_note_notes_FK"))
    private Note note;

    @MapsId("accordId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "accord_id", nullable = false,
            foreignKey = @ForeignKey(name = "accord_note_accords_FK"))
    private Accord accord;

    @Column(nullable = false)
    private Float weight; // DDL의 FLOAT 매핑
}
