package com.comerza.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicApprovalItemDTO {
    private String description;
    private Double quantity;
    private Double unitPrice;
    private Double discount;
    private Double subtotal;
    private String type; // PART, SERVICE, LABOR
}
