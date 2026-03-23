package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rating_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RatingInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "rating_val")
    private Double ratingVal;

    @Column(name = "rating_count")
    private Integer ratingCount;

}