package com.velo.service;


import com.velo.entity.OrderEntity;

import java.util.List;

public interface OrderService {
    OrderEntity createOrder(OrderEntity orderEntity);
    List<OrderEntity> findAllByOrderByOrderIdDesc();
    OrderEntity updateOrderStatus(String newStatus);

}
