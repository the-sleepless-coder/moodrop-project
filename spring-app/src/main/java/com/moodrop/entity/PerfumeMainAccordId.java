package com.moodrop.entity;

import lombok.*;
import java.io.Serializable;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class PerfumeMainAccordId implements Serializable {
    private Integer perfumeId;
    private Integer accordId;
}
