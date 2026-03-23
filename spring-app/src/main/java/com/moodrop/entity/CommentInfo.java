package com.moodrop.entity;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name="comments_info")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(columnDefinition="TEXT")
    private String comment;

    @Column(name = "comment_ko", columnDefinition="TEXT")
    private String commentKo;

}


