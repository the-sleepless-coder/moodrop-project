package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "longevity_info")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LongevityInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column
    private String length;
}
