package com.comerza.api.dto;

import com.comerza.api.enums.WorkOrderStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TrackingTimelineEventDTO {
    private WorkOrderStatus status;
    private LocalDateTime timestamp;
    private String label;
}
