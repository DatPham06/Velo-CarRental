package com.velo.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAlias;
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

    @Column(name = "Status")
    private String status;

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

    @JsonProperty("brand")
    public String getBrand() {
        return Brand;
    }

    @JsonProperty("img")
    public String getIMG() {
        return IMG;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public void setPricePerDay(BigDecimal pricePerDay) {
        this.pricePerDay = pricePerDay;
    }

    @JsonProperty("brand")
    @JsonAlias("Brand")
    public void setBrand(String brand) {
        this.Brand = brand;
    }

    @JsonProperty("img")
    @JsonAlias("IMG")
    public void setIMG(String img) {
        this.IMG = img;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
