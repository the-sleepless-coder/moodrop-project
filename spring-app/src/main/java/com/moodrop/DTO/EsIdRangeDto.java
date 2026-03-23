package com.moodrop.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EsIdRangeDto {
    private long minId;
    private long maxId;
    private long totalCount;
}
