package com.velo.service;

import com.velo.entity.user.AccountEntity;

import java.util.List;

public interface AccountService {
    List<AccountEntity> getAllAccounts();

    AccountEntity register(AccountEntity registration);

    AccountEntity login(AccountEntity credentials);
}
