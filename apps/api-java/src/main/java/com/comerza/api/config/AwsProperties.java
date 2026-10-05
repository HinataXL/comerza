package com.comerza.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aws")
public record AwsProperties(
    String region,
    String accessKeyId,
    String secretAccessKey,
    String s3Bucket
) {
}
