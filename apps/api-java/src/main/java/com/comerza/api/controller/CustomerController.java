package com.comerza.api.controller;

import com.comerza.api.entity.Customer;
import com.comerza.api.repository.CustomerRepository;
import com.comerza.api.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository customerRepository;

    private String getTenantId(UserDetailsImpl userDetails) {
        return userDetails.getUser().getTenant().getId();
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getCustomers(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(customerRepository.findByTenantId(getTenantId(userDetails)));
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        request.setTenant(userDetails.getUser().getTenant());
        return ResponseEntity.status(HttpStatus.CREATED).body(customerRepository.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable String id, @RequestBody Customer request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Customer existing = customerRepository.findByIdAndTenantId(id, getTenantId(userDetails)).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        
        if (request.getName() != null) existing.setName(request.getName());
        if (request.getEmail() != null) existing.setEmail(request.getEmail());
        if (request.getPhone() != null) existing.setPhone(request.getPhone());
        
        return ResponseEntity.ok(customerRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String id, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        Customer existing = customerRepository.findByIdAndTenantId(id, getTenantId(userDetails)).orElse(null);
        if (existing == null) return ResponseEntity.notFound().build();
        
        customerRepository.delete(existing);
        return ResponseEntity.ok().build();
    }
}
