package com.moodrop.entity;

import com.moodrop.model.domain.Accord;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "perfume_main_accords")
@IdClass(PerfumeMainAccordId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PerfumeMainAccord {

    @Id
    @Column(name = "perfume_id")
    private Integer perfumeId;

    @Id
    @Column(name = "accord_id")
    private Integer accordId;

    @Column
    private Integer weight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id", insertable = false, updatable = false)
    private Perfumes perfume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accord_id", insertable = false, updatable = false)
    private Accord accord;
}
