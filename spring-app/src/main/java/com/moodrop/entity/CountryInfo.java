package com.moodrop.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="country_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CountryInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable=false)
    private String country;

}

