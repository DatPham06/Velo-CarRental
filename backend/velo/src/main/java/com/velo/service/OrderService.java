package com.velo.service;


import com.velo.entity.OrderEntity;
import com.velo.entity.PaymentEntity;
import com.velo.dto.response.order.RentalQuote;
import com.velo.dto.response.order.OrderSummary;
import com.velo.dto.response.order.PaymentCheckout;
import com.velo.entity.user.AccountEntity;

import java.time.LocalDate;
import java.util.List;

public interface OrderService {
    RentalQuote quote(Long carId, LocalDate startDate, LocalDate expireDate);
    OrderEntity createOrder(OrderEntity orderEntity, AccountEntity account);
    List<OrderEntity> findAllByOrderByOrderIdDesc();
    OrderSummary.Page listOrders(Long accountId, String status, int page);
    OrderEntity updateOrderStatus(Long id, String newStatus, String expectedStatus);
    PaymentEntity createPayment(Long orderId, String paymentMethod, AccountEntity caller);
    PaymentEntity getPayment(Long orderId, AccountEntity caller);
    PaymentCheckout getCheckout(Long orderId, AccountEntity caller);
}
