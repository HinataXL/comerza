package com.comerza.api.repository;

import com.comerza.api.entity.PublicToken;
import com.comerza.api.enums.PublicTokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface PublicTokenRepository extends JpaRepository<PublicToken, String> {
    Optional<PublicToken> findByTokenHash(String tokenHash);
    List<PublicToken> findByWorkOrderIdAndTokenTypeAndRevokedFalse(String workOrderId, PublicTokenType tokenType);
}
