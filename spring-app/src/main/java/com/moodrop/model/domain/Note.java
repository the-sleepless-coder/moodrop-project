package com.moodrop.model.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NoteType type;

    // enum 타입 정의
    public enum NoteType { TOP, MIDDLE, BASE }

    // getter, setter
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public NoteType getType() { return type; }
    public void setType(NoteType type) { this.type = type; }
}
