package com.comerza.api.controller;

import com.comerza.api.dto.PublicApprovalDTO;
import com.comerza.api.dto.PublicApprovalRejectRequest;
import com.comerza.api.dto.PublicTrackingDTO;
import com.comerza.api.service.PublicTallerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/taller")
@RequiredArgsConstructor
public class PublicTallerController {

    private final PublicTallerService publicTallerService;

    @GetMapping("/approval/{token}")
    public ResponseEntity<PublicApprovalDTO> getApprovalDetails(@PathVariable String token) {
        return ResponseEntity.ok(publicTallerService.getApprovalDetails(token));
    }

    @PostMapping("/approval/{token}/approve")
    public ResponseEntity<Void> approveWorkOrder(@PathVariable String token) {
        publicTallerService.approveWorkOrder(token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/approval/{token}/reject")
    public ResponseEntity<Void> rejectWorkOrder(
            @PathVariable String token, 
            @RequestBody PublicApprovalRejectRequest request) {
        publicTallerService.rejectWorkOrder(token, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tracking/{token}")
    public ResponseEntity<PublicTrackingDTO> getTrackingDetails(@PathVariable String token) {
        return ResponseEntity.ok(publicTallerService.getTrackingDetails(token));
    }
}
