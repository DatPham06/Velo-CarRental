package com.velo.repository;

import com.velo.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity,Long> {
    OrderEntity createOrder(OrderEntity orderEntity);
    List<OrderEntity> findAllByOrderByOrderIdDesc();
}
