package com.moodrop.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PerfumeLikeRankingDto {
    private Integer perfumeId;
    private String perfumeName;
    private Integer likeCount;
}
