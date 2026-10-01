package com.hospital.repository;

import com.hospital.entity.LabTestResult;
import com.hospital.entity.LabTestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabTestResultRepository extends JpaRepository<LabTestResult, Long> {
    List<LabTestResult> findByPatientId(Long patientId);
    List<LabTestResult> findByDoctorId(Long doctorId);
    List<LabTestResult> findByStatus(LabTestStatus status);
}
