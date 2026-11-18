package com.velo.service.impl;

import com.velo.entity.user.AccountEntity;
import com.velo.repository.AccountRepository;
import com.velo.service.AccountService;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AccountServiceImpl implements AccountService {
    private final AccountRepository accountRepository;

    public AccountServiceImpl(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public List<AccountEntity> getAllAccounts() {
        return accountRepository.findAll();
    }

    @Override
    public AccountEntity register(AccountEntity registration) {
        return accountRepository.save(registration);
    }

    @Override
    public AccountEntity login(AccountEntity loginaccount) {
        String email = loginaccount.getEmail();
        String password = loginaccount.getPassword();
        if (email == null || password == null) {
            return null;
        }

        AccountEntity accountEntity = accountRepository.findByEmail(email);
        //neu co tai khoan va dung password
        if (accountEntity != null && password.equals(accountEntity.getPassword())) {
            if (accountEntity.isBanned()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị cấm.");
            }
            return accountEntity;
        }

        return null;
    }

    @Override
    @Transactional
    public AccountEntity setBanned(long id, boolean banned) {
        AccountEntity account = accountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));
        if ("ADMIN".equals(account.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không thể cấm tài khoản quản trị viên.");
        }
        account.setBanned(banned);
        return accountRepository.save(account);
    }


}
