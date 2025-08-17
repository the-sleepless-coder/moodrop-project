package com.moodrop.model.repository;

import com.moodrop.model.domain.MfLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

public interface MfLogRepository extends JpaRepository<MfLog, Long> {
    @Query("select max(l.createdAt) from MfLog l where l.deviceId = :deviceId")
    Optional<LocalDateTime> findLastActivity(@Param("deviceId") String deviceId);

    @Query(value = """
        select coalesce(sum(timestampdiff(second, started_at, completed_at)), 0) as total_sec
        from (
            select j.job_id,
                   min(case when l.event in ('POSSIBLE','PREPARE','STARTED') then l.created_at end) as started_at,
                   max(case when l.event = 'COMPLETED' then l.created_at end) as completed_at
            from mf_job j
            left join mf_log l on l.job_id = j.job_id
            where j.device_id = :deviceId
            group by j.job_id
        ) t
        where started_at is not null and completed_at is not null
        """, nativeQuery = true)
    Long sumManufacturingSeconds(@Param("deviceId") String deviceId);
}