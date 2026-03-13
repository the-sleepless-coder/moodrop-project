package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "perfume_like_ranking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PerfumeLikeRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="perfume_id", nullable = false)
    private Perfumes perfumeId;

    @Column(name = "perfume_name", nullable = false, length = 150)
    private String perfumeName;

    @Column(name = "daily_ranking", nullable = false)
    private Integer ranking;

    @Column(name = "daily_like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "created_at", insertable = false, updatable = false,
            columnDefinition = "datetime DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;
}
