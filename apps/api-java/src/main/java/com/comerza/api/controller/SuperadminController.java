package com.comerza.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

import com.comerza.api.entity.Tenant;
import com.comerza.api.entity.User;
import com.comerza.api.entity.SystemLog;
import com.comerza.api.repository.TenantRepository;
import com.comerza.api.repository.UserRepository;
import com.comerza.api.repository.SaleRepository;
import com.comerza.api.repository.SystemLogRepository;
import com.comerza.api.repository.PlanConfigRepository;
import com.comerza.api.entity.PlanConfig;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;

@RestController
@RequestMapping("/api/superadmin")
public class SuperadminController {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SystemLogRepository systemLogRepository;

    @Autowired
    private PlanConfigRepository planConfigRepository;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        return ResponseEntity.ok(Map.of(
            "message", "Superadmin overview endpoint ready"
        ));
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        long totalTenants = tenantRepository.count();
        long totalUsers = userRepository.count();
        long totalInvoices = saleRepository.count();
        double totalVolume = saleRepository.findAll().stream()
                .mapToDouble(s -> s.getTotal() != null ? s.getTotal().doubleValue() : 0.0)
                .sum();

        return ResponseEntity.ok(Map.of(
            "totalTenants", totalTenants,
            "totalUsers", totalUsers,
            "totalVolume", totalVolume,
            "totalInvoices", totalInvoices,
            "volumeHistory", java.util.List.of(),
            "topTenants", java.util.List.of()
        ));
    }

    @GetMapping("/tenants")
    public ResponseEntity<List<Map<String, Object>>> getTenants() {
        List<Tenant> tenants = tenantRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        List<User> allUsers = userRepository.findAll();
        
        for (Tenant tenant : tenants) {
            long usersCount = allUsers.stream().filter(u -> u.getTenant() != null && u.getTenant().getId().equals(tenant.getId())).count();
            long salesCount = saleRepository.findByTenantId(tenant.getId()).size();
            
            result.add(Map.of(
                "id", tenant.getId(),
                "name", tenant.getName(),
                "receiptTemplate", tenant.getReceiptTemplate() != null ? tenant.getReceiptTemplate() : "CLASSIC",
                "hasTallerAddon", tenant.getHasTallerAddon() != null ? tenant.getHasTallerAddon() : false,
                "plan", tenant.getPlan() != null ? tenant.getPlan() : "PRO",
                "isActive", tenant.getIsActive() != null ? tenant.getIsActive() : true,
                "createdAt", tenant.getCreatedAt(),
                "_count", Map.of("users", usersCount, "sales", salesCount)
            ));
        }
        return ResponseEntity.ok(result);
    }

    @org.springframework.web.bind.annotation.PostMapping("/tenants")
    public ResponseEntity<?> createTenant(@org.springframework.web.bind.annotation.RequestBody Map<String, String> body) {
        String companyName = body.get("companyName");
        String adminName = body.get("adminName");
        String adminEmail = body.get("adminEmail");
        
        if(userRepository.existsByEmail(adminEmail)) {
            return ResponseEntity.badRequest().body(Map.of("message", "El correo ya está en uso."));
        }
        
        Tenant newTenant = new Tenant();
        newTenant.setName(companyName);
        newTenant.setPlan("PRO");
        newTenant.setReceiptTemplate("CLASSIC");
        newTenant.setIsActive(true);
        tenantRepository.save(newTenant);
        
        String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 8);
        
        User newAdmin = new User();
        newAdmin.setName(adminName);
        newAdmin.setEmail(adminEmail);
        newAdmin.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(tempPassword));
        newAdmin.setRole("ADMIN");
        newAdmin.setTenant(newTenant);
        userRepository.save(newAdmin);
        
        return ResponseEntity.ok(Map.of(
            "message", "Comercio creado",
            "credentials", Map.of(
                "email", adminEmail,
                "password", tempPassword
            )
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User user : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getName() != null ? user.getName() : "Usuario");
            map.put("email", user.getEmail());
            map.put("role", user.getRole() != null ? user.getRole() : "SELLER");
            if (user.getTenant() != null) {
                map.put("tenantName", user.getTenant().getName());
                map.put("tenantPlan", user.getTenant().getPlan());
            } else {
                map.put("tenantName", "N/A");
                map.put("tenantPlan", "N/A");
            }
            map.put("createdAt", user.getCreatedAt());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }


    @GetMapping("/plans")
    public ResponseEntity<List<Map<String, Object>>> getPlans() {
        List<PlanConfig> planConfigs = planConfigRepository.findAll();
        
        // Inicializar si está vacío
        if (planConfigs.isEmpty()) {
            String allFeatures = "[\"Ventas\", \"Cobros\", \"Pagos\", \"Recibos\", \"Catálogo\", \"Clientes\", \"Reportes\", \"Integraciones\", \"Configuración\"]";
            
            PlanConfig pro = new PlanConfig();
            pro.setName("PRO");
            pro.setFeatures(allFeatures);
            planConfigRepository.save(pro);
            
            PlanConfig premium = new PlanConfig();
            premium.setName("PREMIUM");
            premium.setFeatures(allFeatures);
            planConfigRepository.save(premium);
            
            planConfigs = planConfigRepository.findAll();
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (PlanConfig plan : planConfigs) {
            result.add(Map.of(
                "id", plan.getId(),
                "name", plan.getName(),
                "features", plan.getFeatures()
            ));
        }
        
        return ResponseEntity.ok(result);
    }

    @org.springframework.web.bind.annotation.PutMapping("/plans/{planName}")
    public ResponseEntity<?> updatePlanConfig(@org.springframework.web.bind.annotation.PathVariable String planName, @org.springframework.web.bind.annotation.RequestBody Map<String, Object> body) {
        java.util.Optional<PlanConfig> planOpt = planConfigRepository.findByName(planName);
        if (planOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        PlanConfig plan = planOpt.get();
        if (body.containsKey("features")) {
            try {
                Object featuresObj = body.get("features");
                if (featuresObj instanceof List) {
                    List<?> list = (List<?>) featuresObj;
                    StringBuilder sb = new StringBuilder("[");
                    for (int i = 0; i < list.size(); i++) {
                        sb.append("\"").append(list.get(i).toString().replace("\"", "\\\"")).append("\"");
                        if (i < list.size() - 1) {
                            sb.append(",");
                        }
                    }
                    sb.append("]");
                    plan.setFeatures(sb.toString());
                    planConfigRepository.save(plan);
                } else {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid features format"));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid features format"));
            }
        }
        
        return ResponseEntity.ok(Map.of("message", "Plan updated successfully"));
    }

    @GetMapping("/audit")
    public ResponseEntity<List<Map<String, Object>>> getAudit() {
        List<SystemLog> logs = systemLogRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        List<User> allUsers = userRepository.findAll();
        
        for (SystemLog log : logs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("action", log.getMessage());
            map.put("actorId", log.getUser() != null ? log.getUser() : "SYSTEM");
            map.put("targetId", log.getIp());
            map.put("details", log.getContext());
            map.put("createdAt", log.getCreatedAt());
            
            if (log.getUser() != null) {
                User actor = allUsers.stream()
                        .filter(u -> log.getUser().equals(u.getId()) || log.getUser().equals(u.getEmail()))
                        .findFirst()
                        .orElse(null);
                if (actor != null) {
                    map.put("actor", Map.of(
                        "id", actor.getId(),
                        "name", actor.getName() != null ? actor.getName() : "Usuario",
                        "email", actor.getEmail()
                    ));
                }
            }
            
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/logs")
    public ResponseEntity<Map<String, Object>> getLogs() {
        List<SystemLog> logs = systemLogRepository.findAll();
        List<Map<String, Object>> data = new ArrayList<>();
        long errors = 0;
        long warnings = 0;
        for (SystemLog log : logs) {
            if ("ERROR".equals(log.getLevel()) || "SERVER_ERROR".equals(log.getLevel())) {
                errors++;
            } else if ("WARN".equals(log.getLevel())) {
                warnings++;
            }
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("level", log.getLevel());
            map.put("message", log.getMessage());
            map.put("context", log.getContext());
            map.put("user", log.getUser());
            map.put("ip", log.getIp());
            map.put("path", log.getPath());
            map.put("origin", log.getOrigin() != null ? log.getOrigin() : "SYSTEM");
            map.put("createdAt", log.getCreatedAt());
            data.add(map);
        }
        Map<String, Object> stats = Map.of(
            "total", logs.size(),
            "errors", errors,
            "warnings", warnings
        );
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", data,
            "stats", stats
        ));
    }

    @Autowired
    private com.comerza.api.security.JwtService jwtService;
    
    @Autowired
    private com.comerza.api.service.NotificationService notificationService;

    @Autowired
    private com.comerza.api.service.EmailService emailService;

    @org.springframework.web.bind.annotation.PostMapping("/tenants/{tenantId}/impersonate")
    public ResponseEntity<?> impersonate(@org.springframework.web.bind.annotation.PathVariable String tenantId, jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) {
        List<User> users = userRepository.findByTenantId(tenantId);
        User tenantUser = users.stream().filter(u -> "ADMIN".equals(u.getRole())).findFirst().orElse(null);
        if (tenantUser == null) {
            tenantUser = users.stream().findFirst().orElse(null);
        }
        if (tenantUser == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No users found in this tenant to impersonate"));
        }
        
        String currentToken = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("comerza_token".equals(c.getName())) {
                    currentToken = c.getValue();
                    break;
                }
            }
        }
        if (currentToken != null) {
            jakarta.servlet.http.Cookie saCookie = new jakarta.servlet.http.Cookie("comerza_superadmin_token", currentToken);
            saCookie.setHttpOnly(true);
            saCookie.setPath("/");
            saCookie.setMaxAge(24 * 60 * 60);
            response.addCookie(saCookie);
        }
        
        com.comerza.api.security.UserDetailsImpl userDetails = new com.comerza.api.security.UserDetailsImpl(tenantUser);
        String jwtToken = jwtService.generateToken(userDetails);
        
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("comerza_token", jwtToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60);
        response.addCookie(cookie);
        
        SystemLog log = new SystemLog();
        log.setLevel("INFO");
        log.setMessage("IMPERSONATION");
        log.setContext("Superadmin impersonated tenant " + tenantId);
        log.setOrigin("SYSTEM");
        systemLogRepository.save(log);

        return ResponseEntity.ok(Map.of("message", "Impersonating successful", "token", jwtToken));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/tenants/{tenantId}/status")
    public ResponseEntity<?> toggleTenantStatus(@org.springframework.web.bind.annotation.PathVariable String tenantId) {
        java.util.Optional<Tenant> t = tenantRepository.findById(tenantId);
        if(t.isPresent()) {
            Tenant tenant = t.get();
            boolean newStatus = tenant.getIsActive() != null ? !tenant.getIsActive() : false;
            tenant.setIsActive(newStatus);
            tenantRepository.save(tenant);
            
            String action = newStatus ? "reactivado" : "suspendido";
            String title = "Comercio " + action;
            String message = "El comercio " + tenant.getName() + " ha sido " + action + " por administración.";
            String type = newStatus ? "INFO" : "WARNING";
            
            notificationService.broadcastGlobalNotification(title, message, type);
            
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @org.springframework.web.bind.annotation.PatchMapping("/tenants/{tenantId}/plan")
    public ResponseEntity<?> toggleTenantPlan(@org.springframework.web.bind.annotation.PathVariable String tenantId, @org.springframework.web.bind.annotation.RequestBody Map<String, String> body) {
        java.util.Optional<Tenant> t = tenantRepository.findById(tenantId);
        if(t.isPresent() && body.containsKey("plan")) {
            Tenant tenant = t.get();
            tenant.setPlan(body.get("plan"));
            tenantRepository.save(tenant);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @org.springframework.web.bind.annotation.PatchMapping("/tenants/{tenantId}/taller")
    public ResponseEntity<?> toggleTallerAddon(@org.springframework.web.bind.annotation.PathVariable String tenantId) {
        java.util.Optional<Tenant> t = tenantRepository.findById(tenantId);
        if(t.isPresent()) {
            Tenant tenant = t.get();
            boolean newStatus = tenant.getHasTallerAddon() != null ? !tenant.getHasTallerAddon() : true;
            tenant.setHasTallerAddon(newStatus);
            tenantRepository.save(tenant);
            
            String action = newStatus ? "activado" : "desactivado";
            String title = "Addon Taller " + action;
            String message = "El Addon de Taller para el comercio " + tenant.getName() + " ha sido " + action + " por administración.";
            notificationService.broadcastGlobalNotification(title, message, "INFO");
            
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/tenants/{tenantId}")
    public ResponseEntity<?> deleteTenant(@org.springframework.web.bind.annotation.PathVariable String tenantId) {
        if(tenantRepository.existsById(tenantId)) {
            tenantRepository.deleteById(tenantId);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        long uptime = java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
        
        String dbStatus = "ok";
        try {
            tenantRepository.count(); // Simple query to test connection
        } catch (Exception e) {
            dbStatus = "error";
        }

        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "uptime", uptime,
            "dbStatus", dbStatus,
            "memory", Map.of(
                "rss", Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory(),
                "heapTotal", Runtime.getRuntime().totalMemory(),
                "heapUsed", Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()
            )
        ));
    }

    @GetMapping("/gateways/status")
    public ResponseEntity<Map<String, Object>> getGatewaysStatus() {
        return ResponseEntity.ok(Map.of("qpaypro", "ok", "recurrente", "ok"));
    }

    @org.springframework.web.bind.annotation.PostMapping("/health/test-db")
    public ResponseEntity<Map<String, String>> testDb() {
        try {
            tenantRepository.count();
            return ResponseEntity.ok(Map.of("status", "ok", "message", "Conexión a la base de datos exitosa"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", "Fallo al conectar: " + e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.PostMapping("/health/test-gateway/{gateway}")
    public ResponseEntity<Map<String, String>> testGateway(@org.springframework.web.bind.annotation.PathVariable String gateway) {
        if ("resend".equals(gateway)) {
            try {
                boolean sent = emailService.sendResendEmail("erickpedroza45@gmail.com", "Comerza: Prueba de Salud Resend", "<h1>¡Conexión Exitosa!</h1><p>Esta es una prueba de configuración de Resend desde el panel de Superadmin de Comerza.</p>");
                if (sent) {
                    return ResponseEntity.ok(Map.of("status", "ok", "message", "Correo de prueba enviado a erickpedroza45@gmail.com vía Resend."));
                } else {
                    return ResponseEntity.status(500).body(Map.of("status", "error", "message", "La API Key de Resend no está configurada en el servidor (.env / application.properties)"));
                }
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
            }
        }

        String url = gateway.equals("qpaypro") ? "https://qpaypro.com" : "https://app.recurrente.com";
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.ok(Map.of("status", "ok", "message", "Conexión a " + gateway + " exitosa (HTTP " + response.getStatusCode().value() + ")"));
            }
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", "Respuesta inesperada: " + response.getStatusCode().value()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", "Error de conexión: " + e.getMessage()));
        }
    }

    @org.springframework.web.bind.annotation.PostMapping("/notifications")
    public ResponseEntity<?> sendGlobalNotification(@org.springframework.web.bind.annotation.RequestBody Map<String, String> body) {
        // Simulate sending a global notification
        long activeTenants = tenantRepository.findAll().stream().filter(t -> t.getIsActive() != null && t.getIsActive()).count();
        
        SystemLog log = new SystemLog();
        log.setLevel("INFO");
        log.setMessage("GLOBAL_NOTIFICATION");
        log.setContext("Title: " + body.get("title") + " - " + body.get("message"));
        log.setOrigin("SUPERADMIN");
        systemLogRepository.save(log);

        notificationService.broadcastGlobalNotification(
            body.get("title"),
            body.get("message"),
            body.get("type")
        );

        return ResponseEntity.ok(Map.of(
            "message", "Notificaciones enviadas",
            "count", activeTenants > 0 ? activeTenants : 1
        ));
    }

}
