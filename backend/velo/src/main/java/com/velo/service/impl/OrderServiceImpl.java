package com.velo.service.impl;

import com.velo.entity.OrderDetailEntity;
import com.velo.entity.OrderEntity;
import com.velo.repository.OrderRepository;
import com.velo.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {
    @Autowired
    private OrderRepository orderRepository;


    @Override
    public OrderEntity createOrder(OrderEntity orderEntity) {
        List<OrderDetailEntity> orderDetails = orderEntity.getOrderDetails();
        if (orderDetails == null || orderDetails.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn thuê phải có ít nhất một xe.");
        }

        for (OrderDetailEntity detail : orderDetails) {
            if (detail == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi tiết đơn thuê không hợp lệ.");
            }
            detail.setOrder(orderEntity);
        }

        return orderRepository.save(orderEntity);
    }

    @Override
    public List<OrderEntity> findAllByOrderByOrderIdDesc() {
        return orderRepository.findAllByOrderByIdDesc();
    }

    @Override
    public OrderEntity updateOrderStatus(String newStatus) {
        OrderEntity orderEntity = new OrderEntity();
        orderEntity.setStatus(newStatus);
        return orderRepository.save(orderEntity);
    }
}
