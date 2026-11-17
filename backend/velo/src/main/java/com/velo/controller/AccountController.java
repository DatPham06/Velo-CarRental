package com.velo.controller;

import com.velo.entity.user.AccountEntity;
import com.velo.service.AccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/account")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/getall")
    public List<AccountEntity> getAllAccounts() {
        return accountService.getAllAccounts();
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountEntity register(@RequestBody AccountEntity registration) {
        return accountService.register(registration);
    }

    @PostMapping("/login")
    public AccountEntity login(@RequestBody AccountEntity loginaccount) {
        AccountEntity accountEntity = accountService.login(loginaccount);
        if (accountEntity == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        return accountEntity;
    }


}
