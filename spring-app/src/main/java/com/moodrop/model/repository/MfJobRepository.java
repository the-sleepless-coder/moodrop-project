package com.moodrop.model.repository;

import com.moodrop.model.domain.MfJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MfJobRepository extends JpaRepository<MfJob, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("update MfJob j set j.status=:status where j.id=:jobId")
    int updateStatus(@Param("jobId") Long jobId, @Param("status") String status);

    // 네이티브 최신 미완료 1건 (유지)
    @Query("""
           select j.id
             from MfJob j
            where j.deviceId = :deviceId
              and j.status in :inProgress
            order by j.createdAt desc
           """)
    Optional<Long> findLastInProgressJobId(
            @Param("deviceId") String deviceId,
            @Param("inProgress") Collection<String> inProgress);

    Optional<MfJob> findTopByDeviceIdAndStatusOrderByCreatedAtDesc(String deviceId, String status);

    @Query("select j.deviceId from MfJob j where j.id = :jobId")
    String findDeviceIdById(@Param("jobId") Long jobId);

    @Query(value = """
        select date_format(j.created_at, '%Y-%m') as ym,
               count(*) as cnt
        from mf_job j
        where j.device_id = :deviceId
        group by ym
        order by ym
        """, nativeQuery = true)
    List<Object[]> monthlyStats(@Param("deviceId") String deviceId);

    @Query("select count(j) from MfJob j where j.deviceId = :deviceId")
    long countAll(@Param("deviceId") String deviceId);

    @Query("select count(j) from MfJob j where j.deviceId = :deviceId and j.status = 'COMPLETED'")
    long countCompleted(@Param("deviceId") String deviceId);
}