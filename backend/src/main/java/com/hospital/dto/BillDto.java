package com.hospital.dto;

import jakarta.validation.constraints.NotNull;

public class BillDto {
    private Long id;

    @NotNull
    private Long patientId;

    private Long admissionId;
    private Double consultationFee = 0.0;
    private Double medicineFee = 0.0;
    private Double labFee = 0.0;
    private Double roomFee = 0.0;
    private Double otherCharges = 0.0;
    private String notes;

    public BillDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getAdmissionId() { return admissionId; }
    public void setAdmissionId(Long admissionId) { this.admissionId = admissionId; }

    public Double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }

    public Double getMedicineFee() { return medicineFee; }
    public void setMedicineFee(Double medicineFee) { this.medicineFee = medicineFee; }

    public Double getLabFee() { return labFee; }
    public void setLabFee(Double labFee) { this.labFee = labFee; }

    public Double getRoomFee() { return roomFee; }
    public void setRoomFee(Double roomFee) { this.roomFee = roomFee; }

    public Double getOtherCharges() { return otherCharges; }
    public void setOtherCharges(Double otherCharges) { this.otherCharges = otherCharges; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
