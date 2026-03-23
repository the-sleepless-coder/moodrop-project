package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "perfume_longevity")
@IdClass(PerfumeLongevityId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PerfumeLongevity {

    @Id
    @Column(name = "perfume_id")
    private Integer perfumeId;

    @Id
    @Column(name = "longevity_info_id")
    private Integer longevityInfoId;

    @Column(name = "vote_num")
    private Integer voteNum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id", insertable = false, updatable = false)
    private Perfumes perfume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "longevity_info_id", insertable = false, updatable = false)
    private LongevityInfo longevityInfo;
}
