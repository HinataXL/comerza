package com.comerza.api.service;

import com.comerza.api.dto.SaleRequest;
import com.comerza.api.dto.SaleItemRequest;
import com.comerza.api.entity.*;
import com.comerza.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SaleService {
    
    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final QPayProService qpayproService;
    private final RecurrenteService recurrenteService;

    @Transactional
    public Sale createSale(String tenantId, User user, SaleRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new RuntimeException("Tenant not found"));
            
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findByIdAndTenantId(request.getCustomerId(), tenantId)
                    .orElse(null);
        }

        double total = 0.0;
        List<SaleItem> saleItems = new ArrayList<>();
        List<Map<String, Object>> paymentItems = new ArrayList<>();

        Sale sale = new Sale();
        sale.setTenant(tenant);
        sale.setUser(user);
        if (customer != null) sale.setCustomer(customer);
        sale.setPaymentMethod(request.getPaymentMethod());
        sale.setStatus("Link de pago".equals(request.getPaymentMethod()) || "Recurrente NFC".equals(request.getPaymentMethod()) ? "PENDING" : "COMPLETED");
        sale.setTotal(0.0); // Prevenir el error de constraint not-null en la BD
        
        sale = saleRepository.save(sale); // Guardar para obtener ID

        for (SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findByIdAndTenantId(itemReq.getProductId(), tenantId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            if (product.getStock() < itemReq.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }

            double lineTotal = product.getPrice() * itemReq.getQuantity();
            total += lineTotal;

            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setProduct(product);
            saleItem.setTenant(tenant);
            saleItem.setQuantity(itemReq.getQuantity());
            saleItem.setPrice(product.getPrice());
            saleItems.add(saleItem);

            paymentItems.add(Map.of(
                    "id", product.getId(),
                    "name", product.getName(),
                    "quantity", itemReq.getQuantity(),
                    "price", product.getPrice()
            ));

            product.setStock(product.getStock() - itemReq.getQuantity());
            productRepository.save(product);
        }

        saleItemRepository.saveAll(saleItems);
        sale.setTotal(total);

        if ("Link de pago".equals(request.getPaymentMethod())) {
            String paymentLink = qpayproService.createPaymentLink(
                    tenant.getQpayproApiKey(), tenant.getQpayproApiSecret(),
                    total, "Cobro de venta #" + sale.getId().substring(sale.getId().length() - 6),
                    sale.getId(),
                    customer != null ? customer.getName() : null,
                    customer != null ? customer.getEmail() : null,
                    customer != null ? customer.getPhone() : null,
                    paymentItems
            );
            sale.setPaymentLink(paymentLink);
        } else if ("Recurrente NFC".equals(request.getPaymentMethod())) {
            if (tenant.getRecurrenteSecretKey() == null || tenant.getRecurrenteTerminalId() == null) {
                throw new RuntimeException("Las credenciales de Recurrente no están configuradas.");
            }
            recurrenteService.createTerminalSessionCommand(
                    tenant.getRecurrenteSecretKey(), tenant.getRecurrenteTerminalId(),
                    total, sale.getId()
            );
        }

        return saleRepository.save(sale);
    }
}
