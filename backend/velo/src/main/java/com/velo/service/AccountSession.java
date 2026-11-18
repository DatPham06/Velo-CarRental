package com.velo.service;

import com.velo.entity.user.AccountEntity;
import com.velo.repository.AccountRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AccountSession {
    private static final String ACCOUNT_ID = "accountId";
    private final AccountRepository accounts;

    public AccountSession(AccountRepository accounts) {
        this.accounts = accounts;
    }

    public void signIn(HttpServletRequest request, AccountEntity account) {
        signOut(request);
        request.getSession(true).setAttribute(ACCOUNT_ID, account.getId());
    }

    public void signOut(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
    }

    public AccountEntity requireAccount(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute(ACCOUNT_ID) instanceof Long id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return accounts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public void requireAdmin(HttpServletRequest request) {
        if (!"ADMIN".equals(requireAccount(request).getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
