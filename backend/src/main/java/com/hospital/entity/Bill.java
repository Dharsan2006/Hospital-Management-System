package com.hospital.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "admission_id")
    private Admission admission;

    private Double consultationFee = 0.0;
    private Double medicineFee = 0.0;
    private Double labFee = 0.0;
    private Double roomFee = 0.0;
    private Double otherCharges = 0.0;

    private Double totalAmount = 0.0;
    private Double paidAmount = 0.0;
    private Double remainingAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillStatus status = BillStatus.UNPAID;

    private LocalDateTime billDate;

    @Column(length = 1000)
    private String notes;

    @PrePersist
    @PreUpdate
    public void calculateTotals() {
        if (billDate == null) {
            billDate = LocalDateTime.now();
        }
        if (consultationFee == null) consultationFee = 0.0;
        if (medicineFee == null) medicineFee = 0.0;
        if (labFee == null) labFee = 0.0;
        if (roomFee == null) roomFee = 0.0;
        if (otherCharges == null) otherCharges = 0.0;
        if (paidAmount == null) paidAmount = 0.0;

        totalAmount = consultationFee + medicineFee + labFee + roomFee + otherCharges;
        remainingAmount = totalAmount - paidAmount;

        if (remainingAmount <= 0 && totalAmount > 0) {
            status = BillStatus.PAID;
            remainingAmount = 0.0;
        } else if (paidAmount > 0 && remainingAmount > 0) {
            status = BillStatus.PARTIAL;
        } else {
            status = BillStatus.UNPAID;
        }
    }

    public Bill() {}

    public Bill(Patient patient, Admission admission, Double consultationFee, Double medicineFee, Double labFee, Double roomFee, Double otherCharges, String notes) {
        this.patient = patient;
        this.admission = admission;
        this.consultationFee = consultationFee != null ? consultationFee : 0.0;
        this.medicineFee = medicineFee != null ? medicineFee : 0.0;
        this.labFee = labFee != null ? labFee : 0.0;
        this.roomFee = roomFee != null ? roomFee : 0.0;
        this.otherCharges = otherCharges != null ? otherCharges : 0.0;
        this.notes = notes;
        calculateTotals();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Admission getAdmission() { return admission; }
    public void setAdmission(Admission admission) { this.admission = admission; }

    public Double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; calculateTotals(); }

    public Double getMedicineFee() { return medicineFee; }
    public void setMedicineFee(Double medicineFee) { this.medicineFee = medicineFee; calculateTotals(); }

    public Double getLabFee() { return labFee; }
    public void setLabFee(Double labFee) { this.labFee = labFee; calculateTotals(); }

    public Double getRoomFee() { return roomFee; }
    public void setRoomFee(Double roomFee) { this.roomFee = roomFee; calculateTotals(); }

    public Double getOtherCharges() { return otherCharges; }
    public void setOtherCharges(Double otherCharges) { this.otherCharges = otherCharges; calculateTotals(); }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public Double getPaidAmount() { return paidAmount; }
    public void setPaidAmount(Double paidAmount) { this.paidAmount = paidAmount; calculateTotals(); }

    public Double getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(Double remainingAmount) { this.remainingAmount = remainingAmount; }

    public BillStatus getStatus() { return status; }
    public void setStatus(BillStatus status) { this.status = status; }

    public LocalDateTime getBillDate() { return billDate; }
    public void setBillDate(LocalDateTime billDate) { this.billDate = billDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
