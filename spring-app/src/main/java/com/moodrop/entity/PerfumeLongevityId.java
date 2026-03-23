package com.moodrop.entity;

import lombok.*;
import java.io.Serializable;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class PerfumeLongevityId implements Serializable {
    private Integer perfumeId;
    private Integer longevityInfoId;
}
