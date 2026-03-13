package com.moodrop.entity;
import com.moodrop.Enums.Category;
import com.moodrop.Enums.GenderType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="image")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Image{

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer id; 

    @Column(length = 200)
    private String OrgFile;

    @Enumerated(EnumType.STRING)
    private Category category;

}