package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name="user_perfumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserPerfumes {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", insertable = false, updatable = false,
            columnDefinition = "datetime DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "rating_average", columnDefinition = "double DEFAULT 0")
    private Double ratingAverage = 0.0;

    @Column(name = "like_count", columnDefinition = "int DEFAULT 0")
    private Integer likeCount = 0;

    @Column(name="view_count", columnDefinition = "int DEFAULT 0")
    private Integer viewCount = 0;

}
