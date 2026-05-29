package com.jobhuntbuddy.backend.dto;
import com.jobhuntbuddy.backend.entity.Platform;
import com.jobhuntbuddy.backend.entity.Status;
import lombok.Data;
import java.time.LocalDate;

@Data
public class JobApplicationDto {
    private String companyName;
    private String jobTitle;
    private String jobUrl;
    private Platform sourcePlatform;
    private Status status;
    private Long resumeId;
    private String jobDescription;
    private String keyRequirements;
    private String salaryRange;
    private String location;
    private Boolean isRemote;
    private LocalDate appliedDate;
    private String notes;
}