package com.comerza.api.service;

import com.comerza.api.dto.WorkOrderQuoteRequest;
import com.comerza.api.entity.*;
import com.comerza.api.enums.*;
import com.comerza.api.repository.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkOrderQuoteServiceTest {
    @Mock WorkOrderRepository orders;
    @Mock ProductRepository products;
    @Mock PublicTokenRepository tokens;
    @InjectMocks WorkOrderQuoteService service;
    WorkOrder order;
    final LocalDateTime updatedAt = LocalDateTime.of(2026, 10, 9, 12, 0);

    @BeforeEach void setUp() {
        order = WorkOrder.builder().id("order").tenant(Tenant.builder().id("tenant").build())
                .updatedAt(updatedAt).build();
        when(orders.findForUpdate("order", "tenant")).thenReturn(Optional.of(order));
    }
    WorkOrderQuoteRequest.Item item(String price, String discount) {
        return new WorkOrderQuoteRequest.Item(WorkOrderItemType.LABOR, "  Cambio de aceite  ", 3,
                new BigDecimal(price), new BigDecimal(discount), null);
    }
    WorkOrderQuoteRequest request(List<WorkOrderQuoteRequest.Item> items, String discount, String tax) {
        return new WorkOrderQuoteRequest(items, new BigDecimal(discount), new BigDecimal(tax), " Diagnóstico ", updatedAt);
    }
    @Test void calculatesExactTotalsAndRevokesOnlyApprovalLinks() {
        PublicToken approval = PublicToken.builder().revoked(false).build();
        when(tokens.findByWorkOrderIdAndTokenTypeAndRevokedFalse("order", PublicTokenType.APPROVAL)).thenReturn(List.of(approval));
        when(orders.saveAndFlush(order)).thenReturn(order);
        var result = service.saveQuote("order", "tenant", request(List.of(item("0.10", "0.05")), "0.05", "0.12"));
        assertEquals(0.25, result.getSubtotal());
        assertEquals(0.32, result.getTotal());
        assertEquals("Cambio de aceite", result.getItems().getFirst().getDescription());
        assertSame(order, result.getItems().getFirst().getWorkOrder());
        assertTrue(approval.getRevoked());
        verify(products, never()).save(any());
        verify(tokens).saveAll(List.of(approval));
    }
    @Test void linksPartsFromSameTenantWithoutDeductingStock() {
        Product part = Product.builder().id("part").stock(10).build();
        when(products.findByIdAndTenantId("part", "tenant")).thenReturn(Optional.of(part));
        var input = new WorkOrderQuoteRequest.Item(WorkOrderItemType.PART, "Filtro", 2, new BigDecimal("50"), BigDecimal.ZERO, "part");
        service.saveQuote("order", "tenant", request(List.of(input), "0", "0"));
        assertSame(part, order.getItems().getFirst().getProduct());
        assertEquals(10, part.getStock());
        verify(products, never()).save(any());
    }
    @Test void rejectsPartFromAnotherTenant() {
        var input = new WorkOrderQuoteRequest.Item(WorkOrderItemType.PART, "Filtro", 1, BigDecimal.TEN, BigDecimal.ZERO, "other-part");
        assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(input), "0", "0")));
        verify(orders, never()).saveAndFlush(any());
    }
    @Test void rejectsProductOnLaborConcept() {
        var input = new WorkOrderQuoteRequest.Item(WorkOrderItemType.LABOR, "Trabajo", 1, BigDecimal.TEN, BigDecimal.ZERO, "part");
        assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(input), "0", "0")));
        verifyNoInteractions(products);
    }
    @Test void rejectsExcessLineDiscountWithoutChangingExistingQuote() {
        order.getItems().add(WorkOrderItem.builder().description("Existente").build());
        assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(item("10", "31")), "0", "0")));
        assertEquals("Existente", order.getItems().getFirst().getDescription());
        verifyNoInteractions(tokens);
    }
    @Test void rejectsExcessGeneralDiscount() {
        assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(item("10", "0")), "31", "0")));
        verify(orders, never()).saveAndFlush(any());
    }
    @Test void rejectsStaleVersion() {
        var request = new WorkOrderQuoteRequest(List.of(item("10", "0")), BigDecimal.ZERO, BigDecimal.ZERO, "", updatedAt.minusSeconds(1));
        var error = assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request));
        assertEquals(409, error.getStatusCode().value());
        verifyNoInteractions(tokens);
    }
    @Test void rejectsApprovedOrClosedOrders() {
        for (WorkOrderStatus status : List.of(WorkOrderStatus.APPROVED, WorkOrderStatus.IN_REPAIR, WorkOrderStatus.READY, WorkOrderStatus.DELIVERED, WorkOrderStatus.CANCELLED)) {
            order.setStatus(status);
            assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(item("10", "0")), "0", "0")));
        }
    }
    @Test void rejectsApprovalSnapshotEvenIfStatusWasChanged() {
        order.setApprovedAt(updatedAt);
        assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(item("10", "0")), "0", "0")));
    }
    @Test void rejectsExistingSale() {
        order.setSale(new Sale());
        assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(item("10", "0")), "0", "0")));
    }
    @Test void rejectsUnknownOrderWithinTenant() {
        when(orders.findForUpdate("order", "tenant")).thenReturn(Optional.empty());
        var error = assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(), "0", "0")));
        assertEquals(404, error.getStatusCode().value());
    }
    @Test void allowsEmptyDraftButRejectsTaxWithoutConcepts() {
        assertThrows(ResponseStatusException.class, () -> service.saveQuote("order", "tenant", request(List.of(), "0", "1")));
        service.saveQuote("order", "tenant", request(List.of(), "0", "0"));
        assertEquals(0, order.getTotal());
        assertTrue(order.getItems().isEmpty());
    }
}
