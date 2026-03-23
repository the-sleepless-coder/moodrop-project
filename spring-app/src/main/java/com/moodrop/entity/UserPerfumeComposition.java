package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_perfume_compositions")
@IdClass(UserPerfumeCompositionId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UserPerfumeComposition {

    @Id
    @Column(name = "user_perfume_id")
    private Integer userPerfumeId;

    @Id
    @Column(name = "note_id")
    private Integer noteId;

    @Column
    private Integer weight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_perfume_id", insertable = false, updatable = false)
    private UserPerfumes userPerfume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", insertable = false, updatable = false)
    private Note note;
}
