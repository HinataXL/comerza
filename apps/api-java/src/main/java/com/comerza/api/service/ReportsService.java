package com.comerza.api.service;

import com.comerza.api.entity.Sale;
import com.comerza.api.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportsService {

    private final SaleRepository saleRepository;

    public Map<String, Object> getSalesReport(String tenantId) {
        List<Sale> transactions = saleRepository.findByTenantId(tenantId);
        
        double totalSalesAmount = transactions.stream().mapToDouble(Sale::getTotal).sum();
        long salesCount = transactions.size();
        double averageTicket = salesCount > 0 ? totalSalesAmount / salesCount : 0;

        return Map.of(
            "kpis", Map.of(
                "totalSalesAmount", totalSalesAmount,
                "salesCount", salesCount,
                "averageTicket", averageTicket
            ),
            "transactions", transactions.stream().map(tx -> Map.of(
                "id", tx.getId(),
                "date", tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : "",
                "customerName", tx.getCustomer() != null ? tx.getCustomer().getName() : "Cliente Final",
                "status", tx.getStatus(),
                "paymentMethod", tx.getPaymentMethod() != null ? tx.getPaymentMethod() : "N/A",
                "total", tx.getTotal()
            )).collect(Collectors.toList()),
            "topProducts", List.of()
        );
    }
}
