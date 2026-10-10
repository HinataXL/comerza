package com.comerza.api.service;

import com.comerza.api.dto.WorkOrderQuoteRequest;
import com.comerza.api.entity.*;
import com.comerza.api.enums.*;
import com.comerza.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class WorkOrderQuoteService {
    private final WorkOrderRepository workOrderRepository;
    private final ProductRepository productRepository;
    private final PublicTokenRepository publicTokenRepository;

    @Transactional
    public WorkOrder saveQuote(String id, String tenantId, WorkOrderQuoteRequest request) {
        WorkOrder order = workOrderRepository.findForUpdate(id, tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orden no encontrada."));
        if (!Objects.equals(order.getUpdatedAt(), request.expectedUpdatedAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La orden cambió mientras editabas. Recarga la página antes de guardar.");
        }
        if (order.getApprovedAt() != null || order.getSale() != null ||
                (order.getStatus() != WorkOrderStatus.RECEIVED &&
                 order.getStatus() != WorkOrderStatus.DIAGNOSIS &&
                 order.getStatus() != WorkOrderStatus.WAITING_APPROVAL)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo puedes editar cotizaciones pendientes de autorización.");
        }
        var items = new ArrayList<WorkOrderItem>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (var input : request.items()) {
            BigDecimal gross = input.unitPrice().multiply(BigDecimal.valueOf(input.quantity()));
            if (input.discount().compareTo(gross) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El descuento de un concepto no puede superar su importe.");
            }
            Product product = null;
            if (input.productId() != null && !input.productId().isBlank()) {
                if (input.itemType() != WorkOrderItemType.PART) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo los repuestos pueden vincularse al inventario.");
                }
                product = productRepository.findByIdAndTenantId(input.productId(), tenantId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repuesto no encontrado en tu inventario."));
            }
            BigDecimal lineTotal = gross.subtract(input.discount()).setScale(2, RoundingMode.HALF_UP);
            items.add(WorkOrderItem.builder().tenant(order.getTenant()).workOrder(order)
                    .itemType(input.itemType()).description(input.description().trim()).product(product)
                    .quantity(input.quantity().doubleValue()).unitPrice(input.unitPrice().doubleValue())
                    .discount(input.discount().doubleValue()).subtotal(lineTotal.doubleValue()).build());
            subtotal = subtotal.add(lineTotal);
        }
        if (request.discount().compareTo(subtotal) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El descuento general no puede superar el subtotal.");
        }
        if (items.isEmpty() && (request.tax().signum() != 0 || request.discount().signum() != 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Agrega conceptos antes de aplicar ajustes.");
        }
        order.getItems().clear();
        order.getItems().addAll(items);
        order.setDiagnosis(request.diagnosis() == null ? null : request.diagnosis().trim());
        order.setSubtotal(subtotal.doubleValue());
        order.setDiscount(request.discount().doubleValue());
        order.setTax(request.tax().doubleValue());
        order.setTotal(subtotal.subtract(request.discount()).add(request.tax()).setScale(2, RoundingMode.HALF_UP).doubleValue());
        // También cambia la versión cuando solo se sustituyen los conceptos.
        order.setUpdatedAt(java.time.LocalDateTime.now());
        // El cliente debe autorizar la versión recién guardada, no un enlace anterior.
        var tokens = publicTokenRepository.findByWorkOrderIdAndTokenTypeAndRevokedFalse(id, PublicTokenType.APPROVAL);
        tokens.forEach(token -> token.setRevoked(true));
        publicTokenRepository.saveAll(tokens);
        return workOrderRepository.saveAndFlush(order);
    }
}
