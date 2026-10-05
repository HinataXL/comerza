package com.comerza.api.controller;

import com.comerza.api.entity.Tenant;
import com.comerza.api.repository.TenantRepository;
import com.comerza.api.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant")
@RequiredArgsConstructor
public class TenantController {

    private final TenantRepository tenantRepository;
    private final com.comerza.api.service.S3StorageService s3StorageService;

    @GetMapping("/current")
    public ResponseEntity<Tenant> getCurrentTenant(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Tenant tenant = tenantRepository.findById(userDetails.getUser().getTenant().getId()).orElseThrow();
        return ResponseEntity.ok(tenant);
    }

    @PutMapping("/current")
    public ResponseEntity<Tenant> updateCurrentTenant(@RequestBody Tenant request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Tenant tenant = tenantRepository.findById(userDetails.getUser().getTenant().getId()).orElseThrow();
        if (request.getName() != null) tenant.setName(request.getName());
        if (request.getQpayproApiKey() != null) tenant.setQpayproApiKey(request.getQpayproApiKey());
        if (request.getLogoUrl() != null) tenant.setLogoUrl(request.getLogoUrl());
        return ResponseEntity.ok(tenantRepository.save(tenant));
    }
    @GetMapping("/settings")
    public ResponseEntity<Tenant> getSettings(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Tenant tenant = tenantRepository.findById(userDetails.getUser().getTenant().getId()).orElseThrow();
        return ResponseEntity.ok(tenant);
    }

    @PostMapping("/settings")
    public ResponseEntity<Tenant> saveSettings(@RequestBody java.util.Map<String, Object> request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Tenant tenant = tenantRepository.findById(userDetails.getUser().getTenant().getId()).orElseThrow();
        if (request.containsKey("name")) tenant.setName((String) request.get("name"));
        return ResponseEntity.ok(tenantRepository.save(tenant));
    }

    @PostMapping(value = "/upload-logo", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadLogo(@RequestParam("image") org.springframework.web.multipart.MultipartFile file, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "No se subió ninguna imagen"));
        }
        try {
            String key = s3StorageService.store(file, userDetails.getUser().getTenant().getId(), "tenant", "logo");
            String url = s3StorageService.generateViewUrl(key);
            
            // Opcional: Actualizar el tenant automáticamente
            Tenant tenant = tenantRepository.findById(userDetails.getUser().getTenant().getId()).orElseThrow();
            tenant.setLogoUrl(url);
            tenantRepository.save(tenant);

            return ResponseEntity.ok(java.util.Map.of("imageUrl", url, "message", "Imagen subida correctamente"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("message", "Error interno al subir la imagen: " + e.getMessage()));
        }
    }

    @GetMapping("/integrations")
    public ResponseEntity<java.util.Map<String, Object>> getIntegrations(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Tenant tenant = tenantRepository.findById(userDetails.getUser().getTenant().getId()).orElseThrow();
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("qpayproApiKey", tenant.getQpayproApiKey() != null ? tenant.getQpayproApiKey() : "");
        response.put("qpayproApiSecret", tenant.getQpayproApiSecret() != null ? tenant.getQpayproApiSecret() : "");
        response.put("isQpayproActive", tenant.getIsQpayproActive() != null ? tenant.getIsQpayproActive() : false);
        response.put("recurrenteSecretKey", tenant.getRecurrenteSecretKey() != null ? tenant.getRecurrenteSecretKey() : "");
        response.put("recurrenteTerminalId", tenant.getRecurrenteTerminalId() != null ? tenant.getRecurrenteTerminalId() : "");
        response.put("isRecurrenteActive", tenant.getIsRecurrenteActive() != null ? tenant.getIsRecurrenteActive() : false);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/integrations")
    public ResponseEntity<Tenant> saveIntegrations(@RequestBody java.util.Map<String, Object> request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Tenant tenant = tenantRepository.findById(userDetails.getUser().getTenant().getId()).orElseThrow();
        
        if (request.containsKey("qpayproApiKey")) tenant.setQpayproApiKey((String) request.get("qpayproApiKey"));
        if (request.containsKey("qpayproApiSecret")) tenant.setQpayproApiSecret((String) request.get("qpayproApiSecret"));
        if (request.containsKey("isQpayproActive")) tenant.setIsQpayproActive((Boolean) request.get("isQpayproActive"));
        
        if (request.containsKey("recurrenteSecretKey")) tenant.setRecurrenteSecretKey((String) request.get("recurrenteSecretKey"));
        if (request.containsKey("recurrenteTerminalId")) tenant.setRecurrenteTerminalId((String) request.get("recurrenteTerminalId"));
        if (request.containsKey("isRecurrenteActive")) tenant.setIsRecurrenteActive((Boolean) request.get("isRecurrenteActive"));
        
        return ResponseEntity.ok(tenantRepository.save(tenant));
    }
}
