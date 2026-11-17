package com.velo.entity;

import com.velo.entity.user.AccountEntity;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;
import java.util.Date;

@Data
@Table(name = "Order")
@DynamicInsert
@DynamicUpdate
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "LateFeePerDay", nullable = false)
    private BigDecimal LateFeePerDay;

    @Column(name = "StartDate", nullable = false)
    private Date StartDate;

    @Column(name = "ExpireDate", nullable = false)
    private Date ExpireDate;

    @Column(name = "ReturnDate", nullable = false)
    private Date ReturnDate;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "TotalPrice", nullable = false)
    private BigDecimal TotalPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id",nullable = false)
    private AccountEntity account;


    public OrderEntity(Long id, BigDecimal lateFeePerDay, Date startDate, Date expireDate, Date returnDate, String status, BigDecimal totalPrice) {
        this.id = id;
        LateFeePerDay = lateFeePerDay;
        StartDate = startDate;
        ExpireDate = expireDate;
        ReturnDate = returnDate;
        this.status = status;
        TotalPrice = totalPrice;
    }

    public OrderEntity() {

    }

    public Long getId() {
        return id;
    }

    public BigDecimal getLateFeePerDay() {
        return LateFeePerDay;
    }

    public Date getStartDate() {
        return StartDate;
    }

    public Date getExpireDate() {
        return ExpireDate;
    }

    public Date getReturnDate() {
        return ReturnDate;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getTotalPrice() {
        return TotalPrice;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setLateFeePerDay(BigDecimal lateFeePerDay) {
        LateFeePerDay = lateFeePerDay;
    }

    public void setStartDate(Date startDate) {
        StartDate = startDate;
    }

    public void setExpireDate(Date expireDate) {
        ExpireDate = expireDate;
    }

    public void setReturnDate(Date returnDate) {
        ReturnDate = returnDate;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        TotalPrice = totalPrice;
    }
}
