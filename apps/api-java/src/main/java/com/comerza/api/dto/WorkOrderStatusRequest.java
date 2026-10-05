package com.comerza.api.dto;

import com.comerza.api.enums.WorkOrderStatus;
import lombok.Data;

@Data
public class WorkOrderStatusRequest {
    private WorkOrderStatus newStatus;
}
