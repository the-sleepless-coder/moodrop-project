package com.moodrop.entity;

import com.moodrop.entity.Note;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "perfume_notes")
@IdClass(PerfumeNoteId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PerfumeNote {

    @Id
    @Column(name = "perfume_id")
    private Integer perfumeId;

    @Id
    @Column(name = "note_id")
    private Integer noteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id", insertable = false, updatable = false)
    private Perfumes perfume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", insertable = false, updatable = false)
    private Note note;
}
