package com.comerza.api.dto;

import lombok.Data;

@Data
public class SaleItemRequest {
    private String productId;
    private Integer quantity;
}
