package com.comerza.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class WorkOrderChecklistRequest {
    private List<WorkOrderChecklistItemRequest> items;
}
