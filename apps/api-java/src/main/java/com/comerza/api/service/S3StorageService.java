package com.comerza.api.service;

import com.comerza.api.config.AwsProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
public class S3StorageService {

    private final S3Client s3Client;
    private final AwsProperties awsProperties;

    public S3StorageService(AwsProperties awsProperties) {
        this.awsProperties = awsProperties;
        
        String finalAccessKey = awsProperties.accessKeyId();
        String finalSecretKey = awsProperties.secretAccessKey();
        String finalRegion = awsProperties.region();
        
        if (finalAccessKey != null && !finalAccessKey.isEmpty() && finalSecretKey != null && !finalSecretKey.isEmpty()) {
            this.s3Client = S3Client.builder()
                    .region(Region.of(finalRegion))
                    .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(finalAccessKey, finalSecretKey)))
                    .build();
        } else {
            // Default provider chain if no explicit keys
            this.s3Client = S3Client.builder()
                    .region(Region.of(finalRegion))
                    .build();
        }
    }

    private S3Presigner getPresigner() {
        String finalAccessKey = awsProperties.accessKeyId();
        String finalSecretKey = awsProperties.secretAccessKey();
        String finalRegion = awsProperties.region();

        if (finalAccessKey != null && !finalAccessKey.isEmpty() && finalSecretKey != null && !finalSecretKey.isEmpty()) {
            return S3Presigner.builder()
                    .region(Region.of(finalRegion))
                    .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(finalAccessKey, finalSecretKey)))
                    .build();
        } else {
            return S3Presigner.builder()
                    .region(Region.of(finalRegion))
                    .build();
        }
    }

    public String store(MultipartFile file, String tenantId, String workOrderId, String category) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file.");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uuid = UUID.randomUUID().toString();
            // tenants/{tenantId}/taller/work-orders/{workOrderId}/{category}/{uuid}.{extension}
            String key = String.format("tenants/%s/taller/work-orders/%s/%s/%s%s", 
                    tenantId, workOrderId, category.toLowerCase(), uuid, extension);

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(awsProperties.s3Bucket())
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            return key;
        } catch (IOException | S3Exception e) {
            throw new RuntimeException("Failed to store file in S3.", e);
        }
    }

    public void delete(String storageKey) {
        try {
            if (storageKey != null && !storageKey.isEmpty()) {
                DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                        .bucket(awsProperties.s3Bucket())
                        .key(storageKey)
                        .build();
                s3Client.deleteObject(deleteObjectRequest);
            }
        } catch (S3Exception e) {
            System.err.println("Failed to delete file " + storageKey + " from S3: " + e.getMessage());
        }
    }
    
    public String generateViewUrl(String storageKey) {
        if (storageKey == null || storageKey.isEmpty()) {
            return null;
        }

        try (S3Presigner presigner = getPresigner()) {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(awsProperties.s3Bucket())
                    .key(storageKey)
                    .build();

            GetObjectPresignRequest getObjectPresignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(60)) // 1 hora de validez
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedGetObjectRequest = presigner.presignGetObject(getObjectPresignRequest);
            return presignedGetObjectRequest.url().toString();
        } catch (Exception e) {
            System.err.println("Failed to generate presigned URL for " + storageKey + ": " + e.getMessage());
            return String.format("https://%s.s3.amazonaws.com/%s", awsProperties.s3Bucket(), storageKey);
        }
    }
}
