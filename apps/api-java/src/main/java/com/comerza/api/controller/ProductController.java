package com.comerza.api.controller;

import com.comerza.api.entity.Product;
import com.comerza.api.repository.ProductRepository;
import com.comerza.api.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;

    // Helper para extraer el tenant del usuario autenticado
    private String getTenantId(UserDetailsImpl userDetails) {
        if (userDetails == null || userDetails.getUser().getTenant() == null) {
            throw new RuntimeException("Unauthorized: No tenant specified");
        }
        return userDetails.getUser().getTenant().getId();
    }

    @GetMapping
    public ResponseEntity<?> getProducts(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            String tenantId = getTenantId(userDetails);
            // Ordenados por defecto o podrías agregar un Sort de Spring Data
            List<Product> products = productRepository.findByTenantId(tenantId);
            return ResponseEntity.ok(products);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Server error retrieving products"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            String tenantId = getTenantId(userDetails);
            Product product = productRepository.findByIdAndTenantId(id, tenantId).orElse(null);
            
            if (product == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));
            }
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            getTenantId(userDetails); // Verifica que tenga tenant
            
            if (request.getName() == null || request.getPrice() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Name and price are required"));
            }

            request.setTenant(userDetails.getUser().getTenant());
            if (request.getStock() == null) request.setStock(0);

            Product savedProduct = productRepository.save(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Server error creating product"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable String id, @RequestBody Product request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            String tenantId = getTenantId(userDetails);
            
            Product existing = productRepository.findByIdAndTenantId(id, tenantId).orElse(null);
            if (existing == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));
            }

            // Actualizamos los campos que vengan en la petición
            if (request.getName() != null) existing.setName(request.getName());
            if (request.getDescription() != null) existing.setDescription(request.getDescription());
            if (request.getPrice() != null) existing.setPrice(request.getPrice());
            if (request.getStock() != null) existing.setStock(request.getStock());
            if (request.getImageUrl() != null) existing.setImageUrl(request.getImageUrl());

            Product updated = productRepository.save(existing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Server error updating product"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            String tenantId = getTenantId(userDetails);
            
            Product existing = productRepository.findByIdAndTenantId(id, tenantId).orElse(null);
            if (existing == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Product not found"));
            }

            productRepository.delete(existing);
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Server error deleting product"));
        }
    }
}
