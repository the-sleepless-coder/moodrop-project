package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "accords",
       uniqueConstraints = @UniqueConstraint(name = "accords_unique", columnNames = "name"))
public class Accord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 150)
    private String name;
}
