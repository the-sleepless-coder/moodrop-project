package com.moodrop.model.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.moodrop.model.domain.AccordNote;
import com.moodrop.model.domain.AccordNoteId;

@Repository
public interface AccordNoteRepository extends JpaRepository<AccordNote, AccordNoteId> {
	
	// noteId들만 필터링해서 AccordNote 한 번에 가져오기
    List<AccordNote> findByNote_IdIn(Collection<Long> noteIds);
	
	 // (옵션) 성능 튜닝: note/accord를 같이 당겨오기
    @Query("""
      select an from AccordNote an
        join fetch an.note n
        join fetch an.accord a
      where n.id in :noteIds
    """)
    List<AccordNote> fetchAllByNoteIds(@Param("noteIds") Collection<Integer> noteIds);
    
//    // 조회 최적화: 필요한 범위만
//    List<AccordNote> findByNote_IdIn(Collection<Integer> noteIds);
//    List<AccordNote> findByAccord_IdIn(Collection<Integer> accordIds);
//    List<AccordNote> findByNote_IdInAndAccord_IdIn(Collection<Integer> noteIds, Collection<Integer> accordIds);
//
//    // 자주 쓰면 fetch join으로 N+1 회피 (옵션)
//    @Query("""
//           select an from AccordNote an
//           join fetch an.note n
//           join fetch an.accord a
//           where n.id in ?1 and a.id in ?2
//           """)
//    List<AccordNote> findWithJoins(Collection<Integer> noteIds, Collection<Integer> accordIds);
}
