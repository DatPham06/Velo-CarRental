package com.velo.service.impl;

import com.velo.entity.OrderDetailEntity;
import com.velo.entity.OrderEntity;
import com.velo.entity.PaymentEntity;
import com.velo.entity.ProductEntity;
import com.velo.dto.response.order.RentalQuote;
import com.velo.dto.response.order.OrderSummary;
import com.velo.dto.response.order.PaymentCheckout;
import com.velo.entity.user.AccountEntity;
import com.velo.repository.OrderRepository;
import com.velo.repository.PaymentRepository;
import com.velo.repository.ProductRepository;
import com.velo.service.OrderService;
import org.hibernate.Hibernate;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.Locale;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@EnableConfigurationProperties(PaymentCheckout.BankAccount.class)
public class OrderServiceImpl implements OrderService {
    private static final ZoneId RENTAL_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final BigDecimal lateFeePerDay;
    private final PaymentCheckout.BankAccount bank;

    public OrderServiceImpl(OrderRepository orderRepository, PaymentRepository paymentRepository,
                            ProductRepository productRepository, PaymentCheckout.BankAccount bank,
                            @Value("${velo.rental.late-fee-per-day:100000}") BigDecimal lateFeePerDay) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
        this.bank = bank;
        if (lateFeePerDay.signum() < 0) {
            throw new IllegalArgumentException("Phí trễ hạn phải lớn hơn hoặc bằng 0.");
        }
        this.lateFeePerDay = lateFeePerDay;
    }

    @Override
    public RentalQuote quote(Long carId, LocalDate startDate, LocalDate expireDate) {
        validateDates(startDate, expireDate);
        ProductEntity car = carId == null ? null : productRepository.findById(carId.longValue());
        if (car == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe.");
        }
        requireAvailable(List.of(car.getId()), startDate, expireDate);
        BigDecimal price = rentalPrice(car);
        long days = ChronoUnit.DAYS.between(startDate, expireDate);
        return new RentalQuote(car.getId(), car.getProductName(), startDate, expireDate,
                days, price, price.multiply(BigDecimal.valueOf(days)), lateFeePerDay);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OrderEntity createOrder(OrderEntity orderEntity, AccountEntity account) {
        LocalDate startDate = asLocalDate(orderEntity.getStartDate());
        LocalDate expireDate = asLocalDate(orderEntity.getExpireDate());
        validateDates(startDate, expireDate);
        List<OrderDetailEntity> orderDetails = orderEntity.getOrderDetails();
        if (orderDetails == null || orderDetails.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đơn thuê phải có ít nhất một xe.");
        }

        for (OrderDetailEntity detail : orderDetails) {
            if (detail == null || detail.getCar() == null || detail.getCar().getId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi tiết đơn thuê không hợp lệ.");
            }
        }

        List<Long> carIds = orderDetails.stream().map(detail -> detail.getCar().getId()).distinct().sorted().toList();
        if (carIds.size() != orderDetails.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mỗi xe chỉ xuất hiện một lần trong đơn.");
        }
        Map<Long, ProductEntity> cars = productRepository.findAllForRental(carIds).stream()
                .collect(Collectors.toMap(ProductEntity::getId, Function.identity()));
        if (cars.size() != carIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe.");
        }
        requireAvailable(carIds, startDate, expireDate);
        BigDecimal dailyTotal = BigDecimal.ZERO;
        for (OrderDetailEntity detail : orderDetails) {
            ProductEntity car = cars.get(detail.getCar().getId());
            BigDecimal price = rentalPrice(car);
            detail.setCar(car);
            detail.setRentalPricePerDay(price);
            detail.setOrder(orderEntity);
            dailyTotal = dailyTotal.add(price);
        }
        orderEntity.setId(null);
        orderEntity.setAccount(account);
        orderEntity.setStartDate(asDate(startDate));
        orderEntity.setExpireDate(asDate(expireDate));
        orderEntity.setReturnDate(null);
        orderEntity.setStatus("PENDING");
        orderEntity.setLateFeePerDay(lateFeePerDay);
        orderEntity.setTotalPrice(dailyTotal.multiply(BigDecimal.valueOf(ChronoUnit.DAYS.between(startDate, expireDate))));
        return orderRepository.save(orderEntity);
    }

    private void validateDates(LocalDate startDate, LocalDate expireDate) {
        if (startDate == null || expireDate == null || startDate.isBefore(LocalDate.now(RENTAL_ZONE))
                || !expireDate.isAfter(startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày nhận phải từ hôm nay và ngày trả phải sau ngày nhận.");
        }
    }

    private BigDecimal rentalPrice(ProductEntity car) {
        if (car.getPricePerDay() == null || car.getPricePerDay().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Xe chưa có giá thuê hợp lệ.");
        }
        return car.getPricePerDay();
    }

    private void requireAvailable(List<Long> carIds, LocalDate startDate, LocalDate expireDate) {
        if (orderRepository.countOverlappingRentals(carIds, asDate(startDate), asDate(expireDate)) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã có lịch thuê trong khoảng ngày này.");
        }
    }

    private Date asDate(LocalDate date) {
        return Date.from(date.atStartOfDay(ZoneOffset.UTC).toInstant());
    }

    private LocalDate asLocalDate(Date date) {
        return date == null ? null : date.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
    }

    private LocalDate rentalDate(Date storedDate) {
        return storedDate == null ? null : storedDate.toInstant().atZone(RENTAL_ZONE).toLocalDate();
    }

    @Override
    public List<OrderEntity> findAllByOrderByOrderIdDesc() {
        return orderRepository.findAllByOrderByIdDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderSummary.Page listOrders(Long accountId, String status, int page) {
        if (page < 0 || page > Integer.MAX_VALUE / 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số trang không hợp lệ.");
        }
        List<String> statuses = switch (status) {
            case "RETURNED" -> List.of("RETURNED", "COMPLETED");
            case "CANCELLED" -> List.of("CANCELLED", "CANCELED");
            case "ALL", "PENDING", "CONFIRMED", "RENTING" -> List.of(status);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ.");
        };
        var result = orderRepository.listOrders(accountId, "ALL".equals(status), statuses, PageRequest.of(page, 10));
        var orders = result.map(order -> summary(order, accountId == null));
        return new OrderSummary.Page(orders.getContent(), page, orders.getTotalPages(), orders.getTotalElements());
    }

    private String statusOf(OrderEntity order) {
        String status = order.getStatus().toUpperCase(Locale.ROOT);
        return switch (status) {
            case "COMPLETED" -> "RETURNED";
            case "CANCELED" -> "CANCELLED";
            default -> status;
        };
    }

    private List<String> nextStatuses(OrderEntity order) {
        return switch (statusOf(order)) {
            case "PENDING" -> List.of("CONFIRMED", "CANCELLED");
            case "CONFIRMED" -> {
                LocalDate today = LocalDate.now(RENTAL_ZONE);
                boolean pickupOpen = !today.isBefore(rentalDate(order.getStartDate()))
                        && today.isBefore(rentalDate(order.getExpireDate()));
                yield pickupOpen ? List.of("RENTING", "CANCELLED") : List.of("CANCELLED");
            }
            case "RENTING" -> List.of("RETURNED");
            default -> List.of();
        };
    }

    private OrderSummary summary(OrderEntity order, boolean admin) {
        var cars = order.getOrderDetails().stream().map(detail -> {
            ProductEntity car = detail.getCar();
            return new OrderSummary.Car(car.getId(), car.getProductName(), car.getIMG(), detail.getRentalPricePerDay());
        }).toList();
        var account = order.getAccount();
        String status = statusOf(order);
        LocalDate due = rentalDate(order.getExpireDate());
        LocalDate returned = rentalDate(order.getReturnDate());
        LocalDate feeThrough = switch (status) {
            case "RENTING" -> LocalDate.now(RENTAL_ZONE);
            case "RETURNED" -> returned;
            default -> null;
        };
        Long lateDays = feeThrough == null ? null : Math.max(0L, ChronoUnit.DAYS.between(due, feeThrough));
        return new OrderSummary(order.getId(), account.getFullName(), account.getEmail(), status,
                rentalDate(order.getStartDate()), due, returned, order.getTotalPrice(), order.getLateFeePerDay(),
                lateDays, cars, admin ? nextStatuses(order) : List.of());
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OrderEntity updateOrderStatus(Long id, String newStatus, String expectedStatus) {
        OrderEntity order = orderRepository.findForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn thuê."));
        Hibernate.initialize(order.getOrderDetails());
        String current = statusOf(order);
        if (current.equals(newStatus)) return order;
        if ((expectedStatus != null && !current.equals(expectedStatus)) || !nextStatuses(order).contains(newStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trạng thái hiện tại không cho phép thao tác này.");
        }
        if ("RENTING".equals(newStatus)) {
            var ids = order.getOrderDetails().stream().map(detail -> detail.getCar().getId()).sorted().toList();
            if (ids.isEmpty() || productRepository.findAllForRental(ids).size() != ids.size()
                    || orderRepository.countCarsOutOnRental(ids) > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Có xe chưa sẵn sàng để bàn giao.");
            }
        }
        order.setStatus(newStatus);
        if ("RETURNED".equals(newStatus)) order.setReturnDate(asDate(LocalDate.now(RENTAL_ZONE)));
        return order;
    }

    private OrderEntity requirePaymentAccess(Optional<OrderEntity> result, AccountEntity caller) {
        return result
                .filter(order -> "ADMIN".equals(caller.getRole()) || caller.getId().equals(order.getAccount().getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn thuê."));
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PaymentEntity createPayment(Long orderId, String paymentMethod, AccountEntity caller) {
        OrderEntity order = requirePaymentAccess(orderRepository.findForUpdate(orderId), caller);
        String method = paymentMethod.strip().toUpperCase(Locale.ROOT);
        if (!"CASH".equals(method) && !"BANK_TRANSFER".equals(method)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phương thức thanh toán không hợp lệ.");
        }
        if ("CANCELLED".equals(statusOf(order)) || paymentRepository.findByOrder_Id(orderId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn đã hủy hoặc đã có thanh toán.");
        }

        PaymentEntity payment = new PaymentEntity();
        payment.setOrder(order);
        payment.setPaymentMethod(method);
        payment.setStatus("PENDING");

        return paymentRepository.save(payment);
    }

    @Override
    public PaymentEntity getPayment(Long orderId, AccountEntity caller) {
        requirePaymentAccess(orderRepository.findById(orderId), caller);
        return paymentRepository.findByOrder_Id(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thanh toán cho đơn thuê."));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentCheckout getCheckout(Long orderId, AccountEntity caller) {
        OrderEntity order = requirePaymentAccess(orderRepository.findById(orderId), caller);
        var payment = paymentRepository.findByOrder_Id(orderId).orElse(null);
        return new PaymentCheckout(summary(order, false), payment, bank.configured() ? bank : null);
    }
}
