package com.moodrop.model.repository;

import com.moodrop.model.domain.DeviceEndpoint;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface DeviceEndpointRepository extends JpaRepository<DeviceEndpoint, String> {

    @Modifying @Transactional
    @Query(value = """
        INSERT INTO device_endpoint(device_id, host)
        VALUES (:deviceId, '-')
        ON DUPLICATE KEY UPDATE device_id = device_id
        """, nativeQuery = true)
    int ensureExists(@Param("deviceId") String deviceId);
}