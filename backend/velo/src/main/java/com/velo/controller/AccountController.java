package com.velo.controller;

import com.velo.entity.user.AccountEntity;
import com.velo.service.AccountService;
import com.velo.service.AccountSession;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AccountSession sessions;

    public AccountController(AccountService accountService, AccountSession sessions) {
        this.accountService = accountService;
        this.sessions = sessions;
    }

    @GetMapping("/getall")
    public List<AccountEntity> getAllAccounts(HttpServletRequest request) {
        sessions.requireAdmin(request);
        return accountService.getAllAccounts();
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountEntity register(@RequestBody AccountEntity registration) {
        return accountService.register(registration);
    }

    @PostMapping("/login")
    public AccountEntity login(@RequestBody AccountEntity loginaccount, HttpServletRequest request) {
        AccountEntity accountEntity = accountService.login(loginaccount);
        if (accountEntity == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        sessions.signIn(request, accountEntity);
        return accountEntity;
    }

    @GetMapping("/me")
    public AccountEntity me(HttpServletRequest request) {
        return sessions.requireAccount(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        sessions.signOut(request);
    }
}
