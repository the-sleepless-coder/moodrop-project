package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "perfume_season")
@IdClass(PerfumeSeasonId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PerfumeSeason {

    @Id
    @Column(name = "perfume_id")
    private Integer perfumeId;

    @Id
    @Column(name = "season")
    private String season;

    @Column
    private Integer weight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id", insertable = false, updatable = false)
    private Perfumes perfume;
}
