package com.hospital.dto;

import jakarta.validation.constraints.NotNull;

public class DischargeDto {
    @NotNull
    private Long admissionId;

    private String dischargeSummary;

    public DischargeDto() {}

    public Long getAdmissionId() { return admissionId; }
    public void setAdmissionId(Long admissionId) { this.admissionId = admissionId; }

    public String getDischargeSummary() { return dischargeSummary; }
    public void setDischargeSummary(String dischargeSummary) { this.dischargeSummary = dischargeSummary; }
}
