package com.velo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "Car")
@DynamicUpdate
@DynamicInsert
public class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(columnDefinition = "varchar(255)",nullable = false)
    private String productName;
    @Column(name = "PricePerDay")
    private BigDecimal pricePerDay;
    @Column(name = "Brand")
    private String Brand;
    @Column(name = "IMG")
    private String IMG;

    public ProductEntity(Long id, String productName, BigDecimal pricePerDay, String brand, String IMG) {
        this.id = id;
        this.productName = productName;
        this.pricePerDay = pricePerDay;
        Brand = brand;
        this.IMG = IMG;
    }

    public ProductEntity() {

    }

    public Long getId() {
        return id;
    }

    public String getProductName() {
        return productName;
    }

    public BigDecimal getPricePerDay() {
        return pricePerDay;
    }

    public String getBrand() {
        return Brand;
    }

    public String getIMG() {
        return IMG;
    }


}
