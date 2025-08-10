package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AccordNoteId implements Serializable {
    @Column(name = "note_id",   nullable = false)
    private Integer noteId;

    @Column(name = "accord_id", nullable = false)
    private Integer accordId;

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AccordNoteId that)) return false;
        return Objects.equals(noteId, that.noteId) && Objects.equals(accordId, that.accordId);
    }
    @Override public int hashCode() { return Objects.hash(noteId, accordId); }
}
