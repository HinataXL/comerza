package com.comerza.api.dto;

import lombok.Data;

@Data
public class WorkOrderDeliveryRequest {
    private Integer exitMileage;
    private String deliveryNotes; // We can use customerNotes or internalNotes for this
}
