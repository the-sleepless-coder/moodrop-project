package com.moodrop.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserPerfumeCompositionId implements Serializable {
    private Integer userPerfumeId;
    private Integer noteId;
}
