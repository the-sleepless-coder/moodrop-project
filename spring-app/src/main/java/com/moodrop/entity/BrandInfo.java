package com.moodrop.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="brand_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BrandInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable=false)
    private String name;

}

