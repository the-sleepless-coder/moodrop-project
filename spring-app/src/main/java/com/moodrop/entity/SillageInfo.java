package com.moodrop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sillage_info")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SillageInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column
    private String strength;
}
