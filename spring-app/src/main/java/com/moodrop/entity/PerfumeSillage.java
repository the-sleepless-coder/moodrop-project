package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "perfume_sillage")
@IdClass(PerfumeSillageId.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PerfumeSillage {

    @Id
    @Column(name = "perfume_id")
    private Integer perfumeId;

    @Id
    @Column(name = "sillage_info_id")
    private Integer sillageInfoId;

    @Column(name = "vote_num")
    private Integer voteNum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id", insertable = false, updatable = false)
    private Perfumes perfume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sillage_info_id", insertable = false, updatable = false)
    private SillageInfo sillageInfo;
}
