package com.comerza.api.dto;

import com.comerza.api.enums.WorkOrderChecklistItemStatus;
import lombok.Data;

@Data
public class WorkOrderChecklistItemRequest {
    private String itemCode;
    private String labelSnapshot;
    private WorkOrderChecklistItemStatus status;
    private String notes;
}
