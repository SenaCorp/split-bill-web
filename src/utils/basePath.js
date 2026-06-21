const normalizeBasePath = (value = '/') => {
  const rawValue = String(value || '/').trim();
  if (!rawValue || rawValue === '/') return '';
  return `/${rawValue.replace(/^\/+|\/+$/g, '')}`;
};

export const appBasePath = normalizeBasePath(import.meta.env.VITE_APP_BASE_PATH || import.meta.env.BASE_URL || '/');

export const stripBasePath = (pathname = window.location.pathname) => {
  if (!appBasePath) return pathname;
  if (pathname === appBasePath) return '/';
  if (pathname.startsWith(`${appBasePath}/`)) {
    return pathname.slice(appBasePath.length) || '/';
  }
  return pathname;
};

export const withBasePath = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${appBasePath}${normalizedPath}` || '/';
};

export const appUrl = (path = '/') => `${window.location.origin}${withBasePath(path)}`;
