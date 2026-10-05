package com.comerza.api.controller;

import com.comerza.api.security.UserDetailsImpl;
import com.comerza.api.service.ReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportsController {

    private final ReportsService reportsService;

    @GetMapping("/sales")
    public ResponseEntity<Map<String, Object>> getSalesReports(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(reportsService.getSalesReport(userDetails.getUser().getTenant().getId()));
    }
}
