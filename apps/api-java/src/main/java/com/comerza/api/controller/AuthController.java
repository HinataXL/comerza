package com.comerza.api.controller;

import com.comerza.api.controller.dto.AuthRequest;
import com.comerza.api.controller.dto.AuthResponse;
import com.comerza.api.entity.User;
import com.comerza.api.repository.UserRepository;
import com.comerza.api.security.JwtService;
import com.comerza.api.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final com.comerza.api.repository.PlanConfigRepository planConfigRepository;
    private final JwtService jwtService;

    @GetMapping("/debug/features")
    public ResponseEntity<?> debugFeatures() {
        return ResponseEntity.ok(planConfigRepository.findAll());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request, jakarta.servlet.http.HttpServletResponse response) {
        
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        UserDetailsImpl userDetails = new UserDetailsImpl(user);

        String jwtToken = jwtService.generateToken(userDetails);

        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("comerza_token", jwtToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60);
        response.addCookie(cookie);

        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwtToken)
                .userId(user.getId())
                .name(user.getName())
                .role(user.getRole())
                .build());
    }

    @org.springframework.web.bind.annotation.GetMapping("/me")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<java.util.Map<String, Object>> getMe(@org.springframework.security.core.annotation.AuthenticationPrincipal UserDetailsImpl userDetails, jakarta.servlet.http.HttpServletRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findById(userDetails.getUser().getId()).orElseThrow();
        java.util.Map<String, Object> responseMap = new java.util.HashMap<>();
        
        java.util.Map<String, Object> userMap = new java.util.HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole());
        responseMap.put("user", userMap);
        
        if (user.getTenant() != null) {
            java.util.Map<String, Object> tenantMap = new java.util.HashMap<>();
            tenantMap.put("id", user.getTenant().getId());
            tenantMap.put("name", user.getTenant().getName());
            String planName = user.getTenant().getPlan() != null ? user.getTenant().getPlan() : "FREE";
            tenantMap.put("plan", planName);
            tenantMap.put("hasTallerAddon", user.getTenant().getHasTallerAddon() != null ? user.getTenant().getHasTallerAddon() : false);
            
            java.util.List<String> allowedFeatures = new java.util.ArrayList<>();
            
            // Fetch all plans and match case-insensitively
            java.util.List<com.comerza.api.entity.PlanConfig> allPlans = planConfigRepository.findAll();
            com.comerza.api.entity.PlanConfig matchedPlan = null;
            for (com.comerza.api.entity.PlanConfig p : allPlans) {
                if (p.getName().equalsIgnoreCase(planName)) {
                    matchedPlan = p;
                    break;
                }
            }
            java.util.Optional<com.comerza.api.entity.PlanConfig> planOpt = java.util.Optional.ofNullable(matchedPlan);
            
            boolean parsedSuccessfully = false;

            if (planOpt.isPresent() && planOpt.get().getFeatures() != null) {
                try {
                    String rawFeatures = planOpt.get().getFeatures().trim();
                    if (rawFeatures.startsWith("[") && rawFeatures.endsWith("]")) {
                        String content = rawFeatures.substring(1, rawFeatures.length() - 1);
                        if (!content.isEmpty()) {
                            String[] items = content.split(",");
                            for (String item : items) {
                                String feature = item.trim().replace("\"", "");
                                // Map features from Superadmin names to Sidebar names if necessary
                                if (feature.equals("Catálogo")) feature = "Productos";
                                if (!feature.isEmpty()) {
                                    allowedFeatures.add(feature);
                                }
                            }
                        }
                        parsedSuccessfully = true;
                    }
                } catch (Exception e) {
                    System.err.println("Error parsing features: " + e.getMessage());
                }
            } 
            
            if (!parsedSuccessfully) {
                // Default features if no plan config or parsing failed
                allowedFeatures.addAll(java.util.Arrays.asList("Ventas", "Cobros", "Clientes", "Productos", "Reportes", "Configuración"));
            }
            
            System.out.println("DEBUG - AuthController.me()");
            System.out.println("Plan: " + planName);
            System.out.println("PlanOpt Present: " + planOpt.isPresent());
            if (planOpt.isPresent()) {
                System.out.println("Raw Features in DB: " + planOpt.get().getFeatures());
            }
            System.out.println("Parsed successfully: " + parsedSuccessfully);
            System.out.println("Allowed Features sent to UI: " + allowedFeatures);
            
            tenantMap.put("features", allowedFeatures);
            responseMap.put("tenant", tenantMap);
        } else {
            responseMap.put("tenant", null);
        }
        
        boolean isImpersonating = false;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("comerza_superadmin_token".equals(c.getName())) {
                    isImpersonating = true;
                    break;
                }
            }
        }
        responseMap.put("isImpersonating", isImpersonating);
        
        return ResponseEntity.ok(responseMap);
    }

    @PostMapping("/unimpersonate")
    public ResponseEntity<?> unimpersonate(jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) {
        String superadminToken = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : request.getCookies()) {
                if ("comerza_superadmin_token".equals(c.getName())) {
                    superadminToken = c.getValue();
                    break;
                }
            }
        }
        
        if (superadminToken != null) {
            jakarta.servlet.http.Cookie tokenCookie = new jakarta.servlet.http.Cookie("comerza_token", superadminToken);
            tokenCookie.setHttpOnly(true);
            tokenCookie.setPath("/");
            tokenCookie.setMaxAge(24 * 60 * 60);
            response.addCookie(tokenCookie);
            
            jakarta.servlet.http.Cookie saCookie = new jakarta.servlet.http.Cookie("comerza_superadmin_token", null);
            saCookie.setHttpOnly(true);
            saCookie.setPath("/");
            saCookie.setMaxAge(0);
            response.addCookie(saCookie);
            
            return ResponseEntity.ok(java.util.Map.of("message", "Returned to superadmin"));
        }
        return ResponseEntity.badRequest().body(java.util.Map.of("message", "Not impersonating"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletResponse response) {
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("comerza_token", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        
        jakarta.servlet.http.Cookie saCookie = new jakarta.servlet.http.Cookie("comerza_superadmin_token", null);
        saCookie.setHttpOnly(true);
        saCookie.setPath("/");
        saCookie.setMaxAge(0);
        response.addCookie(saCookie);
        
        return ResponseEntity.ok(java.util.Map.of("message", "Logged out successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.comerza.api.controller.dto.ProfileUpdateRequest request, @org.springframework.security.core.annotation.AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(java.util.Map.of("message", "Unauthorized"));
        }
        User user = userRepository.findById(userDetails.getUser().getId()).orElseThrow();
        
        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(request.getPassword()));
        }
        
        userRepository.save(user);
        return ResponseEntity.ok(java.util.Map.of("message", "Profile updated successfully"));
    }
}
