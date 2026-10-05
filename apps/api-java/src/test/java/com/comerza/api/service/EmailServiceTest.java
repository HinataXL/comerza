package com.comerza.api.service;

import com.comerza.api.entity.Customer;
import com.comerza.api.entity.Sale;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(restTemplate);
    }

    @Test
    void testSendResendEmail_MissingApiKey_SimulatesEmail() {
        // Given
        ReflectionTestUtils.setField(emailService, "resendApiKey", "");

        // When
        emailService.sendResendEmail("test@example.com", "Test Subject", "<p>Test</p>");

        // Then
        verify(restTemplate, never()).exchange(anyString(), any(), any(), eq(String.class));
    }

    @Test
    void testSendResendEmail_TestApiKey_SimulatesEmail() {
        // Given
        ReflectionTestUtils.setField(emailService, "resendApiKey", "test_api_key");

        // When
        emailService.sendResendEmail("test@example.com", "Test Subject", "<p>Test</p>");

        // Then
        verify(restTemplate, never()).exchange(anyString(), any(), any(), eq(String.class));
    }

    @Test
    void testSendResendEmail_ValidApiKey_SendsEmailSuccessfully() {
        // Given
        ReflectionTestUtils.setField(emailService, "resendApiKey", "re_123456789");
        ResponseEntity<String> responseEntity = new ResponseEntity<>("{\"id\": \"123\"}", HttpStatus.OK);
        when(restTemplate.exchange(eq("https://api.resend.com/emails"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When
        emailService.sendResendEmail("user@example.com", "Alert", "<b>Warning</b>");

        // Then
        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, Object>>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1)).exchange(eq("https://api.resend.com/emails"), eq(HttpMethod.POST), entityCaptor.capture(), eq(String.class));

        HttpEntity<Map<String, Object>> capturedEntity = entityCaptor.getValue();
        assertEquals("Bearer re_123456789", capturedEntity.getHeaders().getFirst("Authorization"));
        assertEquals("application/json", capturedEntity.getHeaders().getFirst("Content-Type"));

        Map<String, Object> body = capturedEntity.getBody();
        assertNotNull(body);
        assertEquals("Alert", body.get("subject"));
        assertEquals("<b>Warning</b>", body.get("html"));
        assertEquals("Comerza <noreply@comerza.me>", body.get("from"));
        assertArrayEquals(new String[]{"user@example.com"}, (String[]) body.get("to"));
    }

    @Test
    void testSendPaymentReceiptEmail() {
        // Given
        ReflectionTestUtils.setField(emailService, "resendApiKey", "re_validkey");
        Customer customer = new Customer();
        customer.setName("John Doe");
        customer.setEmail("johndoe@example.com");

        Sale sale = new Sale();
        sale.setId("sale-123");
        sale.setTotal(150.50);
        sale.setCustomer(customer);

        ResponseEntity<String> responseEntity = new ResponseEntity<>("ok", HttpStatus.OK);
        when(restTemplate.exchange(eq("https://api.resend.com/emails"), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(responseEntity);

        // When
        emailService.sendPaymentReceiptEmail(sale);

        // Then
        @SuppressWarnings("unchecked")
        ArgumentCaptor<HttpEntity<Map<String, Object>>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(eq("https://api.resend.com/emails"), eq(HttpMethod.POST), entityCaptor.capture(), eq(String.class));
        
        Map<String, Object> body = entityCaptor.getValue().getBody();
        assertNotNull(body);
        assertEquals("Recibo de Pago - Comerza", body.get("subject"));
        assertTrue(((String) body.get("html")).contains("150.5"));
        assertTrue(((String) body.get("html")).contains("John Doe"));
    }
}
