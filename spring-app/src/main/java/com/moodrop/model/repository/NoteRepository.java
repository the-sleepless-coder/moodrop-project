package com.moodrop.model.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.moodrop.model.domain.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, Integer> {
	Optional<Note> findByName(String name);
    List<Note> findByNameIn(Collection<String> names);
}
