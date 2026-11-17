package com.velo.controller;

import com.velo.entity.OrderEntity;
import com.velo.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/order")
public class OrderController {
    @Autowired
    private OrderService orderService;

    @PostMapping("/create")
    public OrderEntity createOrder(@RequestBody OrderEntity orderEntity) {
        return orderService.createOrder(orderEntity);
    }

    @GetMapping("/getall")
    public List<OrderEntity> getAllByOrderByOrderIdDesc() {
        return orderService.findAllByOrderByOrderIdDesc();
    }

    @PostMapping("/{id}/updatestatus")
    public OrderEntity updateOrderStatus(@PathVariable long id,@RequestParam String newStatus) {
        return orderService.updateOrderStatus(newStatus);
    }
}
