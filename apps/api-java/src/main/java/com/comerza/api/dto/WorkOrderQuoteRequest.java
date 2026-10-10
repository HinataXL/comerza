package com.comerza.api.dto;

import com.comerza.api.enums.WorkOrderItemType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record WorkOrderQuoteRequest(
        @NotNull @Size(max = 100) List<@NotNull @Valid Item> items,
        @NotNull @DecimalMin("0") @Digits(integer = 6, fraction = 2) BigDecimal discount,
        @NotNull @DecimalMin("0") @Digits(integer = 6, fraction = 2) BigDecimal tax,
        @Size(max = 5000) String diagnosis,
        @NotNull LocalDateTime expectedUpdatedAt) {
    public record Item(
            @NotNull WorkOrderItemType itemType,
            @NotBlank @Size(max = 500) String description,
            @NotNull @Min(1) @Max(100000) Integer quantity,
            @NotNull @DecimalMin("0") @Digits(integer = 6, fraction = 2) BigDecimal unitPrice,
            @NotNull @DecimalMin("0") @Digits(integer = 6, fraction = 2) BigDecimal discount,
            String productId) {}
}
