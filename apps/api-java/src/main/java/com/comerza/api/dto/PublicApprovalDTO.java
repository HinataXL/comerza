package com.comerza.api.dto;

import com.comerza.api.enums.WorkOrderStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PublicApprovalDTO {
    private String businessName;
    private String workOrderNumber;
    private String vehicleBrand;
    private String vehicleModel;
    private Integer vehicleYear;
    private String plate;
    private String customerFirstName;
    
    private String diagnosisSummary;
    private List<PublicApprovalItemDTO> items;
    
    private Double subtotal;
    private Double discount;
    private Double tax;
    private Double total;
    
    private WorkOrderStatus status;
    private LocalDateTime expiresAt;
}
