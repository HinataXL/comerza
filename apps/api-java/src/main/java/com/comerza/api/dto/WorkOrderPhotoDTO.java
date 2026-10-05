package com.comerza.api.dto;

import com.comerza.api.enums.WorkOrderPhotoCategory;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WorkOrderPhotoDTO {
    private String id;
    private WorkOrderPhotoCategory category;
    private String description;
    private String contentType;
    private Long sizeBytes;
    private LocalDateTime createdAt;
    private String uploadedByName;
    private String viewUrl;
}
