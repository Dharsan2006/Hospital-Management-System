package com.hospital.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "lab_tests")
public class LabTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String code;

    private String category;

    @Column(nullable = false)
    private Double price;

    private String normalRange;

    @Column(length = 1000)
    private String description;

    public LabTest() {}

    public LabTest(String name, String code, String category, Double price, String normalRange, String description) {
        this.name = name;
        this.code = code;
        this.category = category;
        this.price = price;
        this.normalRange = normalRange;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getNormalRange() { return normalRange; }
    public void setNormalRange(String normalRange) { this.normalRange = normalRange; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
