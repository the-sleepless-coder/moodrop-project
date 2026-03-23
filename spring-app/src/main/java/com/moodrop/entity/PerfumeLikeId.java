package com.moodrop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PerfumeLikeId implements Serializable {

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "perfume_id")
    private Integer perfumeId;
}
