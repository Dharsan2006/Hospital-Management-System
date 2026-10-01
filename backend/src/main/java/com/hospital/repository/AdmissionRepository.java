package com.hospital.repository;

import com.hospital.entity.Admission;
import com.hospital.entity.AdmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdmissionRepository extends JpaRepository<Admission, Long> {
    List<Admission> findByPatientId(Long patientId);
    List<Admission> findByDoctorId(Long doctorId);
    List<Admission> findByStatus(AdmissionStatus status);
}
