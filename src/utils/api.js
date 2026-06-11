const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const apiUrl = (path) => `${apiBaseUrl}${path}`;

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.error ? payload.error : 'Request failed. Please try again.';
    throw new Error(message);
  }

  return payload;
};
