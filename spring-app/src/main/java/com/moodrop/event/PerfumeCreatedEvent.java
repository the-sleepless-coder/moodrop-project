package com.moodrop.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PerfumeCreatedEvent {
    private int perfumeId;
    private String url;
    private String s3Key;
    private String description;
    private List<String> comments;
}
