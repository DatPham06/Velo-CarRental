export async function submitAccount(operation, data) {
  let response;
  try {
    response = await fetch(`/api/account/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Velo-Request': '1' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('Không kết nối được với máy chủ. Vui lòng thử lại.');
  }

  if (operation === 'login' && response.status === 401) {
    throw new Error('Email hoặc mật khẩu chưa đúng.');
  }
  if (operation === 'login' && response.status === 403) {
    throw new Error('Tài khoản đã bị cấm. Vui lòng liên hệ quản trị viên.');
  }
  if (operation === 'register' && response.status === 409) {
    throw new Error('Email này đã được đăng ký.');
  }
  if (response.status === 400 || response.status === 422) {
    throw new Error('Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.');
  }
  if (!response.ok) {
    throw new Error('Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.');
  }

  const account = await response.json().catch(() => null);
  if (typeof account?.email !== 'string' || !account.email) {
    throw new Error('Máy chủ trả về dữ liệu tài khoản không hợp lệ.');
  }

  return { id: account.id, fullName: account.fullName, email: account.email, phone: account.phone, role: account.role };
}
