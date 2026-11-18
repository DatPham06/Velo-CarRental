package com.velo.dto.response.order;

import com.velo.entity.PaymentEntity;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

public record PaymentCheckout(OrderSummary order, PaymentEntity payment, BankAccount bank) {
    @ConfigurationProperties("velo.payment.bank")
    public record BankAccount(String name, String number, String holder) {
        public boolean configured() {
            return StringUtils.hasText(name) && StringUtils.hasText(number) && StringUtils.hasText(holder);
        }
    }
}
