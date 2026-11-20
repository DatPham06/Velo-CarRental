package com.velo.controller;

import com.velo.entity.OrderEntity;
import com.velo.entity.PaymentEntity;
import com.velo.service.OrderService;
import com.velo.service.AccountSession;
import com.velo.dto.response.order.CartQuote;
import com.velo.dto.response.order.OrderSummary;
import com.velo.dto.response.order.PaymentCheckout;
import com.velo.dto.response.order.RentalQuote;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/order")
public class OrderController {
    private final OrderService orderService;
    private final AccountSession sessions;

    public OrderController(OrderService orderService, AccountSession sessions) {
        this.orderService = orderService;
        this.sessions = sessions;
    }

    @GetMapping("/quote")
    public RentalQuote quote(@RequestParam("carId") Long carId,
                             @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                             @RequestParam("expireDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expireDate) {
        return orderService.quote(carId, startDate, expireDate);
    }

    @GetMapping("/cart-quote")
    public CartQuote cartQuote(
            @RequestParam("carIds") List<Long> carIds,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("expireDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expireDate,
            @RequestParam(name = "deliveryMethod", defaultValue = "PICKUP") String deliveryMethod,
            @RequestParam(name = "promotionCode", required = false) String promotionCode) {
        return orderService.quoteCart(carIds, startDate, expireDate, deliveryMethod, promotionCode);
    }

    @PostMapping("/create")
    public OrderEntity createOrder(@RequestBody OrderEntity orderEntity, HttpServletRequest request) {
        return orderService.createOrder(orderEntity, sessions.requireAccount(request));
    }

    @GetMapping("/getall")
    public List<OrderEntity> getAllByOrderByOrderIdDesc(HttpServletRequest request) {
        sessions.requireAdmin(request);
        return orderService.findAllByOrderByOrderIdDesc();
    }

    @GetMapping("/mine")
    public OrderSummary.Page mine(@RequestParam(name = "status", defaultValue = "ALL") String status,
                                  @RequestParam(name = "page", defaultValue = "0") int page,
                                  HttpServletRequest request) {
        return orderService.listOrders(sessions.requireAccount(request).getId(), status, page);
    }

    @GetMapping("/manage")
    public OrderSummary.Page manage(@RequestParam(name = "status", defaultValue = "ALL") String status,
                                    @RequestParam(name = "page", defaultValue = "0") int page,
                                    HttpServletRequest request) {
        sessions.requireAdmin(request);
        return orderService.listOrders(null, status, page);
    }

    @PostMapping("/{id}/updatestatus")
    public OrderEntity updateOrderStatus(@PathVariable("id") long id, @RequestParam("newStatus") String newStatus,
                                        @RequestParam(name = "expectedStatus", required = false) String expectedStatus,
                                        HttpServletRequest request) {
        sessions.requireAdmin(request);
        return orderService.updateOrderStatus(id, newStatus, expectedStatus);
    }

    @GetMapping("/{id}/checkout")
    public PaymentCheckout checkout(@PathVariable("id") Long orderId, HttpServletRequest request) {
        return orderService.getCheckout(orderId, sessions.requireAccount(request));
    }

    @PostMapping("/{id}/payment")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentEntity createPayment(@PathVariable("id") Long orderId,
                                       @RequestParam("paymentMethod") String paymentMethod, HttpServletRequest request) {
        return orderService.createPayment(orderId, paymentMethod, sessions.requireAccount(request));
    }

    @GetMapping("/{id}/payment")
    public PaymentEntity getPayment(@PathVariable("id") Long orderId, HttpServletRequest request) {
        return orderService.getPayment(orderId, sessions.requireAccount(request));
    }
}
