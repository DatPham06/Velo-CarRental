export async function requestApi(path, { signal, ...options } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      cache: 'no-store',
      ...options,
      headers: { Accept: 'application/json', ...(options.method === 'POST' && { 'X-Velo-Request': '1' }), ...options.headers },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Không kết nối được với máy chủ. Vui lòng thử lại.');
  }

  if (!response.ok) {
    const messages = {
      400: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.',
      401: 'Vui lòng đăng nhập để tiếp tục.',
      403: 'Tài khoản chưa có quyền thực hiện thao tác này.',
      404: 'Không tìm thấy dữ liệu yêu cầu.',
      409: 'Xe đã có lịch thuê trong khoảng ngày này. Vui lòng chọn ngày khác.',
      422: 'Xe chưa có giá thuê hợp lệ.',
    };
    const error = new Error(messages[response.status] || 'Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại.');
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (data === null) throw new Error('Máy chủ trả về dữ liệu không hợp lệ.');
  return data;
}
