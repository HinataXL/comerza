package com.comerza.api.dto;

import com.comerza.api.enums.WorkOrderStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PublicTrackingDTO {
    private String businessName;
    private String workOrderNumber;
    private String vehicleBrand;
    private String vehicleModel;
    private Integer vehicleYear;
    private String plate;
    
    private WorkOrderStatus currentStatus;
    private List<TrackingTimelineEventDTO> timeline;
    private LocalDateTime lastUpdated;
    private Double approvedTotal;
}
