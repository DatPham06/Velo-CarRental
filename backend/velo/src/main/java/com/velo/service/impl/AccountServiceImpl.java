package com.velo.service.impl;

import com.velo.entity.user.AccountEntity;
import com.velo.repository.AccountRepository;
import com.velo.service.AccountService;
import org.springframework.dao.DataIntegrityViolationException;
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
        String cccd = registration.getCccd();
        if (cccd == null || !cccd.strip().matches("[0-9]{12}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CCCD phải có đúng 12 chữ số.");
        }
        registration.setCccd(cccd.strip());
        if (accountAlreadyExists(registration)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email hoặc CCCD đã được sử dụng.");
        }
        try {
            return accountRepository.save(registration);
        } catch (DataIntegrityViolationException exception) {
            if (accountAlreadyExists(registration)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email hoặc CCCD đã được sử dụng.");
            }
            throw exception;
        }
    }

    private boolean accountAlreadyExists(AccountEntity registration) {
        return accountRepository.existsByEmail(registration.getEmail()) || accountRepository.existsByCccd(registration.getCccd());
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
