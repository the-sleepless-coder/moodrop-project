package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "perfume_day_night")
@IdClass(PerfumeDayNightId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PerfumeDayNight {

    @Id
    @Column(name = "perfume_id")
    private Integer perfumeId;

    @Id
    @Column(name = "day_night")
    private String dayNight;

    @Column
    private Integer weight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id", insertable = false, updatable = false)
    private Perfumes perfume;
}
