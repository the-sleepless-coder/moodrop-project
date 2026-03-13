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
public class PerfumeCommentId implements Serializable {
    // 복합키를 쓰는 경우 perfumeCommentId 클래스르 따로 만들어준다.
    @Column(name = "perfume_id")
    private Integer perfumeId;

    @Column(name = "comment_id")
    private Integer commentId;
}
