package com.hospital.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class PrescriptionDto {
    private Long id;
    private Long medicalRecordId;

    @NotNull
    private Long patientId;

    @NotNull
    private Long doctorId;

    private List<PrescriptionItemDto> medicines;

    public PrescriptionDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMedicalRecordId() { return medicalRecordId; }
    public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public List<PrescriptionItemDto> getMedicines() { return medicines; }
    public void setMedicines(List<PrescriptionItemDto> medicines) { this.medicines = medicines; }
}
