package com.moodrop.model.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.moodrop.model.domain.Accord;

@Repository
public interface AccordRepository extends JpaRepository<Accord, Integer> {
	Optional<Accord> findByName(String name);
    List<Accord> findByNameIn(Collection<String> names);
}
