package com.velo.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.velo.entity.user.AccountEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "orders")
@DynamicInsert
@DynamicUpdate
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @Column(name = "LateFeePerDay", nullable = false)
    private BigDecimal lateFeePerDay;

    @Column(name = "StartDate", nullable = false)
    private Date startDate;

    @Column(name = "ExpireDate", nullable = false)
    private Date expireDate;

    @Column(name = "ReturnDate")
    private Date returnDate;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "TotalPrice", nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "delivery_method", length = 12)
    private String deliveryMethod;

    @Column(name = "delivery_address", length = 255)
    private String deliveryAddress;

    @Column(name = "delivery_fee", precision = 38, scale = 2)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal deliveryFee;

    @Column(name = "promotion_code", length = 32)
    private String promotionCode;

    @Column(name = "discount_amount", precision = 38, scale = 2)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private BigDecimal discountAmount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private AccountEntity account;

    @OneToMany(mappedBy = "order", cascade = CascadeType.PERSIST)
    @BatchSize(size = 10)
    private List<OrderDetailEntity> orderDetails = new ArrayList<>();

    public OrderEntity(Long id, BigDecimal lateFeePerDay, Date startDate, Date expireDate, Date returnDate, String status, BigDecimal totalPrice) {
        this.id = id;
        this.lateFeePerDay = lateFeePerDay;
        this.startDate = startDate;
        this.expireDate = expireDate;
        this.returnDate = returnDate;
        this.status = status;
        this.totalPrice = totalPrice;
    }

    public OrderEntity() {

    }

    public Long getId() {
        return id;
    }

    public BigDecimal getLateFeePerDay() {
        return lateFeePerDay;
    }

    public Date getStartDate() {
        return startDate;
    }

    public Date getExpireDate() {
        return expireDate;
    }

    public Date getReturnDate() {
        return returnDate;
    }

    public String getStatus() {
        return status;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public AccountEntity getAccount() {
        return account;
    }

    public void setAccount(AccountEntity account) {
        this.account = account;
    }

    public List<OrderDetailEntity> getOrderDetails() {
        return orderDetails;
    }

    public void setOrderDetails(List<OrderDetailEntity> orderDetails) {
        this.orderDetails = orderDetails;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setLateFeePerDay(BigDecimal lateFeePerDay) {
        this.lateFeePerDay = lateFeePerDay;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public void setExpireDate(Date expireDate) {
        this.expireDate = expireDate;
    }

    public void setReturnDate(Date returnDate) {
        this.returnDate = returnDate;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getDeliveryMethod() {
        return deliveryMethod;
    }

    public void setDeliveryMethod(String deliveryMethod) {
        this.deliveryMethod = deliveryMethod;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public String getPromotionCode() {
        return promotionCode;
    }

    public void setPromotionCode(String promotionCode) {
        this.promotionCode = promotionCode;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }
}
