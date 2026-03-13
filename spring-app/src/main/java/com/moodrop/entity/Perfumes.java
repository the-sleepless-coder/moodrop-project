package com.moodrop.entity;
import com.moodrop.Enums.GenderType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="perfumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Perfumes {

    // perfume에 대한 정보를, 
    // lazy loading & fetch join을 통해서 가져온다.
    // 그럼으로써 1+N 문제를 해결한다.
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition="TEXT")
    private String description;

    @Column(name = "description_ko", columnDefinition="TEXT")
    private String descriptionKo;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender_id")
    private GenderType gender;

    private Integer year;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="brand_id")
    private BrandInfo brand;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="country_id")
    private CountryInfo country;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="rating_id")
    private RatingInfo rating;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int likeCount;

}

