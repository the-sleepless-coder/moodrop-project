package com.moodrop.elasticsearch;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AutocompleteDto {
    private Integer id;
    private String name;
    private String brand;
    private Double rating;
}
