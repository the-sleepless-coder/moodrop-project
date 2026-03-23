package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_perfumes_like_ranking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserPerfumesLikeRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "recipe_id", nullable = false, unique = true)
    private Integer recipeId;

    @Column(name = "recipe_name", nullable = false, length = 150)
    private String recipeName;

    @Column(name = "daily_ranking", nullable = false)
    private Integer ranking;

    @Column(name = "daily_like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "created_at", insertable = false, updatable = false,
            columnDefinition = "datetime DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name="stat_date", nullable = false)
    private LocalDate statDate;
}
