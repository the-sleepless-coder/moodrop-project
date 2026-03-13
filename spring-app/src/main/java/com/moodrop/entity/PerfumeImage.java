package com.moodrop.entity;

import com.moodrop.Enums.ImageType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "perfume_image")
@Getter
@Setter
public class PerfumeImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfume_id", nullable = false)
    private Perfumes perfume;

    @Enumerated(EnumType.STRING)
    @Column(name = "image_type", length = 50)
    private ImageType imageType;

    @Column(name = "s3_key", length = 255)
    private String s3Key;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}