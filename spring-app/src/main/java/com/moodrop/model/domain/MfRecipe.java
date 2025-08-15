package com.moodrop.model.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="mf_recipe")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfRecipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="job_id", nullable=false) private Long jobId;
    @Column(name="slot_id", nullable=false) private Long slotId;
    @Column(name="ingredient_id")          private Long ingredientId;
    @Column(name="name")                   private String name;
    @Column(name="prop")                   private Long prop;
}