package com.velo.entity.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.Locale;

@Entity
@Table(name = "AccountEntity")
public class AccountEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FullName", length = 255, nullable = false)
    private String fullName;

    @Column(name = "Email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "Password", length = 255, nullable = false)
    private String password;

    @Column(name = "Phone")
    private String phone;

    protected AccountEntity() {
    }

    public AccountEntity(String fullName, String email, String password, String phone) {
        this.fullName = fullName;
        setEmail(email);
        this.password = password;
        this.phone = phone;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.toLowerCase(Locale.ROOT);
    }

    public String getPassword() {
        return password;
    }

    public String getPhone() {
        return phone;
    }
}
