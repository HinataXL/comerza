package com.comerza.api.service;

import com.comerza.api.entity.PublicToken;
import com.comerza.api.entity.WorkOrder;
import com.comerza.api.enums.PublicTokenType;
import com.comerza.api.repository.PublicTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicTokenService {

    private final PublicTokenRepository publicTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    public String generateToken(WorkOrder workOrder, PublicTokenType tokenType, int expirationDays) {
        // 1. Revoke existing tokens for this WorkOrder and type
        List<PublicToken> existingTokens = publicTokenRepository.findByWorkOrderIdAndTokenTypeAndRevokedFalse(workOrder.getId(), tokenType);
        for (PublicToken pt : existingTokens) {
            pt.setRevoked(true);
            publicTokenRepository.save(pt);
        }

        // 2. Generate cryptographically secure token
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String plainToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // 3. Hash token
        String tokenHash = hashToken(plainToken);

        // 4. Save to DB
        PublicToken publicToken = PublicToken.builder()
                .tenant(workOrder.getTenant())
                .workOrder(workOrder)
                .tokenHash(tokenHash)
                .tokenType(tokenType)
                .expiresAt(LocalDateTime.now().plusDays(expirationDays))
                .revoked(false)
                .build();
        
        publicTokenRepository.save(publicToken);

        // 5. Return plain token
        return plainToken;
    }

    public PublicToken validateToken(String plainToken, PublicTokenType expectedType) {
        String tokenHash = hashToken(plainToken);
        PublicToken publicToken = publicTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (publicToken.getRevoked()) {
            throw new RuntimeException("Token revoked");
        }

        if (publicToken.getExpiresAt() != null && publicToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        if (publicToken.getTokenType() != expectedType) {
            throw new RuntimeException("Invalid token type");
        }

        return publicToken;
    }

    @Transactional
    public void revokeToken(PublicToken publicToken) {
        publicToken.setRevoked(true);
        publicTokenRepository.save(publicToken);
    }

    private String hashToken(String plainToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(plainToken.getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}
