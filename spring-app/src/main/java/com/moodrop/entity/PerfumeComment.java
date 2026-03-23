package com.moodrop.entity;

import com.moodrop.entity.CommentInfo;
import com.moodrop.entity.Perfumes;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "perfume_comment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PerfumeComment{

    // 복합키를 써야할 경우,
    // EmbeddedId를 써서 Java에서 DB에서 복합키를 쓴다는 것을 알아야 한다.
    @EmbeddedId
    private PerfumeCommentId id;

    // 해당 테이블에서 정의한 FK가 EmbeddedId 내 perfumeId와 동일하다는 것을 표시해준다.
    // perfume 테이블의 PK를 FK로 가져온다.
    @MapsId("perfumeId")
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="perfume_id", nullable = false)
    private Perfumes perfume;

    // comment 테이블의 PK를 FK로 가져온다.
    @MapsId("commentId")
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="comment_id", nullable = false)
    private CommentInfo comment;

}