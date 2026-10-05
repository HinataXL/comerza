package com.comerza.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class SaleRequest {
    private String customerId;
    private String paymentMethod;
    private List<SaleItemRequest> items;
}
