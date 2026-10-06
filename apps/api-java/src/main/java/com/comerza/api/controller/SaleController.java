package com.comerza.api.controller;

import com.comerza.api.entity.Sale;
import com.comerza.api.repository.SaleRepository;
import com.comerza.api.dto.SaleRequest;
import com.comerza.api.security.UserDetailsImpl;
import com.comerza.api.service.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleRepository saleRepository;
    private final SaleService saleService;

    @GetMapping
    public ResponseEntity<List<Sale>> getSales(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(saleRepository.findByTenantId(userDetails.getUser().getTenant().getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Sale> getSaleById(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Sale sale = saleRepository.findByIdAndTenantId(id, userDetails.getUser().getTenant().getId()).orElse(null);
        if (sale == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(sale);
    }
    
    @PostMapping
    public ResponseEntity<?> createSale(@RequestBody SaleRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Sale sale = saleService.createSale(
                userDetails.getUser().getTenant().getId(),
                userDetails.getUser(),
                request
            );
            return ResponseEntity.status(201).body(sale);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Sale> updateSaleStatus(@PathVariable String id, @RequestBody Sale request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Sale sale = saleRepository.findByIdAndTenantId(id, userDetails.getUser().getTenant().getId()).orElse(null);
        if (sale == null) return ResponseEntity.notFound().build();
        
        sale.setStatus(request.getStatus());
        return ResponseEntity.ok(saleRepository.save(sale));
    }

    @PostMapping("/{id}/verify-clave")
    public ResponseEntity<?> verifyClaveCheckout(@PathVariable String id, @RequestParam String checkoutId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            Sale sale = saleService.verifyClaveCheckout(id, checkoutId, userDetails.getUser().getTenant().getId());
            return ResponseEntity.ok(sale);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
