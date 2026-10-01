package com.hospital.controller;

import com.hospital.entity.Medicine;
import com.hospital.exception.BadRequestException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.repository.MedicineRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "*")
public class MedicineController {

    @Autowired
    private MedicineRepository medicineRepository;

    @GetMapping
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    @GetMapping("/{id}")
    public Medicine getMedicineById(@PathVariable Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
    }

    @GetMapping("/low-stock")
    public List<Medicine> getLowStockMedicines(@RequestParam(defaultValue = "10") Integer threshold) {
        return medicineRepository.findByStockQuantityLessThanEqual(threshold);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public Medicine createMedicine(@Valid @RequestBody Medicine medicine) {
        if (medicine.getStockQuantity() < 0) {
            throw new BadRequestException("Stock quantity cannot be negative.");
        }
        return medicineRepository.save(medicine);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public Medicine updateMedicine(@PathVariable Long id, @Valid @RequestBody Medicine details) {
        Medicine med = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
        if (details.getStockQuantity() != null && details.getStockQuantity() < 0) {
            throw new BadRequestException("Stock quantity cannot be negative.");
        }
        med.setName(details.getName());
        med.setCategory(details.getCategory());
        med.setManufacturer(details.getManufacturer());
        med.setPrice(details.getPrice());
        med.setStockQuantity(details.getStockQuantity());
        med.setUnit(details.getUnit());
        med.setExpiryDate(details.getExpiryDate());
        return medicineRepository.save(med);
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('PHARMACIST', 'ADMIN')")
    public Medicine updateStock(@PathVariable Long id, @RequestParam Integer quantity) {
        Medicine med = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
        if (med.getStockQuantity() + quantity < 0) {
            throw new BadRequestException("Operation would result in negative stock.");
        }
        med.setStockQuantity(med.getStockQuantity() + quantity);
        return medicineRepository.save(med);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMedicine(@PathVariable Long id) {
        Medicine med = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
        medicineRepository.delete(med);
        return ResponseEntity.ok().build();
    }
}
