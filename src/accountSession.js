import { useEffect, useState } from 'react';
import { requestApi } from './api.js';

export function useAccount() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    requestApi('/account/me', { signal: controller.signal })
      .then(setAccount)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setAccount(null);
        if (err.status !== 401) setError(err.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  return { account, setAccount, loading, error, retry: () => setRevision(value => value + 1) };
}

export function accountLabel(account, guestLabel = 'Tài khoản') {
  return account?.fullName?.trim() || account?.userName?.trim() || account?.email || guestLabel;
}

export function roleLabel(role) {
  if (role === 'ADMIN') return 'Quản trị viên';
  if (role === 'USER') return 'Người dùng';
  return 'Chưa có thông tin quyền';
}
