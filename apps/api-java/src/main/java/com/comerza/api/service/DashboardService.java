package com.comerza.api.service;

import com.comerza.api.entity.Sale;
import com.comerza.api.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final SaleRepository saleRepository;

    public Map<String, Object> getDashboardMetrics(String tenantId) {
        List<Sale> allSales = saleRepository.findByTenantId(tenantId);
        
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime yesterdayStart = todayStart.minusDays(1);
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Sale> todaySales = allSales.stream()
                .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().isAfter(todayStart) && "COMPLETED".equals(s.getStatus()))
                .collect(Collectors.toList());

        List<Sale> yesterdaySales = allSales.stream()
                .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().isAfter(yesterdayStart) && s.getCreatedAt().isBefore(todayStart) && "COMPLETED".equals(s.getStatus()))
                .collect(Collectors.toList());

        List<Sale> monthSales = allSales.stream()
                .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().isAfter(monthStart) && "COMPLETED".equals(s.getStatus()))
                .collect(Collectors.toList());

        double todayTotal = todaySales.stream().mapToDouble(Sale::getTotal).sum();
        double yesterdayTotal = yesterdaySales.stream().mapToDouble(Sale::getTotal).sum();
        double monthTotal = monthSales.stream().mapToDouble(Sale::getTotal).sum();

        long pendingCount = allSales.stream().filter(s -> "PENDING".equals(s.getStatus())).count();
        double pendingTotal = allSales.stream().filter(s -> "PENDING".equals(s.getStatus())).mapToDouble(Sale::getTotal).sum();

        // Calculate line chart data for last 7 days
        List<Map<String, Object>> lineData = new java.util.ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = todayStart.minusDays(i);
            LocalDateTime dayEnd = dayStart.plusDays(1);
            double dayTotal = allSales.stream()
                    .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().isAfter(dayStart) && s.getCreatedAt().isBefore(dayEnd) && "COMPLETED".equals(s.getStatus()))
                    .mapToDouble(Sale::getTotal).sum();
            lineData.add(Map.of(
                "name", dayStart.getDayOfWeek().toString().substring(0, 3), // e.g. MON, TUE
                "ventas", dayTotal
            ));
        }

        return Map.of(
            "kpis", Map.of(
                "ventasDelMes", Map.of(
                    "value", todayTotal, 
                    "yesterdayValue", yesterdayTotal,
                    "monthValue", monthTotal,
                    "isPositive", todayTotal >= yesterdayTotal
                ),
                "cobrosPendientes", Map.of("value", pendingTotal, "count", pendingCount, "isPositive", false)
            ),
            "charts", Map.of(
                "pieData", List.of(),
                "lineData", lineData
            ),
            "gatewaysAndFel", Map.of("activeGateways", Map.of("qpaypro", true, "recurrente", true)),
            "tables", Map.of(
                "transactions", allSales.stream().sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())).limit(5).map(s -> Map.of(
                    "date", s.getCreatedAt().toString(),
                    "client", s.getCustomer() != null ? s.getCustomer().getName() : "Cliente Final",
                    "amount", "Q " + s.getTotal(),
                    "status", s.getStatus()
                )).collect(Collectors.toList()),
                "invoices", List.of()
            )
        );
    }
}
