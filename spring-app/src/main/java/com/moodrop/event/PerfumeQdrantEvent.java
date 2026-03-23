package com.moodrop.event;

import com.moodrop.elasticsearch.PerfumeEsDocument;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PerfumeQdrantEvent {
    Integer perfumeId;
    PerfumeEsDocument document;
}
