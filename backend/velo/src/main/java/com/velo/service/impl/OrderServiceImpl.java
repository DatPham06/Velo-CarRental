package com.velo.service.impl;

import com.velo.entity.OrderEntity;
import com.velo.repository.OrderRepository;
import com.velo.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {
    @Autowired
    private OrderRepository orderRepository;


    @Override
    public OrderEntity createOrder(OrderEntity orderEntity) {
        return orderRepository.save(orderEntity);
    }

    @Override
    public List<OrderEntity> findAllByOrderByOrderIdDesc() {
        return orderRepository.findAllByOrderByOrderIdDesc();
    }

    @Override
    public OrderEntity updateOrderStatus(String newStatus) {
        OrderEntity orderEntity = new OrderEntity();
        orderEntity.setStatus(newStatus);
        return orderRepository.save(orderEntity);
    }
}
