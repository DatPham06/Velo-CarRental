package com.velo.entity.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.velo.entity.OrderEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Entity
@Table(name = "Account")
@DynamicUpdate
@DynamicInsert
public class AccountEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @Column(name = "FullName", length = 255, nullable = false)
    private String fullName;

    @Column(name = "UserName")
    private String userName;

    @Column(name = "Email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "Password", length = 255, nullable = false)
    private String password;

    @Column(name = "Phone")
    private String phone;

    @Column(name = "cccd", length = 12, unique = true)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String cccd;

    @Column(name = "Role")
    private String role = "USER";

    @Column(name = "Banned", nullable = false, columnDefinition = "boolean default false")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private boolean banned;

    @OneToMany(mappedBy = "account")
    @JsonIgnore
    private List<OrderEntity> orders = new ArrayList<>();

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

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.toLowerCase(Locale.ROOT);
    }

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getPassword() {
        return password;
    }

    public String getPhone() {
        return phone;
    }

    public String getCccd() {
        return cccd;
    }

    public void setCccd(String cccd) {
        this.cccd = cccd;
    }

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public String getRole() {
        return role;
    }

    public boolean isBanned() {
        return banned;
    }

    public void setBanned(boolean banned) {
        this.banned = banned;
    }

    public List<OrderEntity> getOrders() {
        return orders;
    }
}
