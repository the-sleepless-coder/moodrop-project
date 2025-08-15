package com.moodrop.model.enums;

public enum ManufactureStatus {
    CREATED,      // 생성됨(HTTP 요청 시)
    PREPARE,      // 장비 가능 신호 직전/준비 상태
    PROGRESS,     // 장비가 실제 제조 중
    COMPLETED,    // 완료
    FAILED,       // 실패
    CANCELLED     // 취소
}