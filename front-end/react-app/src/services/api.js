/**
 * Se7enSquare - Central API Client Module
 * Provides unified request configuration, headers, identity injection, and account status handling.
 */

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Retrieves the currently stored user session safely without sensitive fields.
 */
export function getStoredUser() {
  try {
    const raw =
      localStorage.getItem('nexus_user') ||
      localStorage.getItem('currentUser') ||
      localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (!user || typeof user !== 'object') return null;
    if (user) {
      delete user.password;
      delete user.passwordHash;
    }
    if (user.id !== undefined && user.id !== null && !isNaN(Number(user.id))) {
      user.id = Number(user.id);
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Clears authenticated session from localStorage.
 */
export function clearUserSession() {
  localStorage.removeItem('user');
  localStorage.removeItem('nexus_user');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('role');
}

/**
 * Persists an authenticated user session into localStorage with whitelisted fields only.
 */
export function storeUserSession(user) {
  if (!user) {
    clearUserSession();
    return;
  }

  const rawId = user.id ?? user.userId ?? user._id;
  const parsedId = rawId !== undefined && rawId !== null && !isNaN(Number(rawId)) ? Number(rawId) : rawId;

  const safeSession = {
    id: parsedId,
    username: user.username,
    role: user.role || 'user',
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    avatar: user.avatar || null,
    status: user.status || 'active',
  };

  localStorage.removeItem('user');
  localStorage.setItem('nexus_user', JSON.stringify(safeSession));
  localStorage.setItem('currentUser', JSON.stringify(safeSession));
  localStorage.setItem('role', safeSession.role);
  window.dispatchEvent(new Event('session-updated'));
}

/**
 * If an admin changes a user's role, the session in localStorage still has the
 * OLD role, so every request sends a stale x-role header. The backend guard
 * (auth-context.guard.ts) then answers 403 "Role mismatch: declared role does
 * not match user account role in database". In that case we log out and send
 * the user to /login so they get a fresh session with the new role.
 *
 * Note: roles.guard.ts also says "Role mismatch: access denied" when a role is
 * simply not allowed to do something. That one must NOT log out, so we match
 * only the "declared role does not match" text.
 * Returns true if it handled the error.
 */
export function handleRoleMismatch(data) {
  const message = data && typeof data === 'object' ? String(data.message || '') : '';
  if (!message.includes('declared role does not match')) return false;
  clearUserSession();
  if (typeof window !== 'undefined') {
    window.location.href = '/login?roleChanged=1';
  }
  return true;
}

/**
 * Standardized HTTP request handler with automatic JSON serialization and role/identity headers.
 */
export async function apiRequest(endpoint, options = {}) {
  const user = getStoredUser();
  const role = user?.role || localStorage.getItem('role') || 'user';

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    'x-role': role,
    ...(user?.id !== undefined && user?.id !== null ? { 'x-user-id': String(user.id) } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    if (netErr instanceof TypeError && (netErr.message.includes('fetch') || netErr.message.includes('Network'))) {
      const connErr = new Error(
        'Unable to connect to Se7enSquare server. Please ensure the backend is running.'
      );
      connErr.status = 0;
      connErr.isNetworkError = true;
      throw connErr;
    }
    throw netErr;
  }

  const contentType = response.headers.get('content-type') || '';
  const data = (contentType && contentType.includes('application/json'))
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const rawMessage = (data && typeof data === 'object' && data.message)
      ? data.message
      : `Request failed with status ${response.status}`;
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code || null;
    error.reason = data?.reason || null;
    error.until = data?.until || null;
    error.data = data;

    // Stale role in the session (admin changed it) -> log out, go to /login
    if (response.status === 403) handleRoleMismatch(data);

    // Handle suspended and banned accounts
    if (data?.code === 'ACCOUNT_BANNED' || data?.code === 'ACCOUNT_SUSPENDED') {
      const isAppeal = typeof window !== 'undefined' && window.location.pathname.startsWith('/appeal');
      if (data.code === 'ACCOUNT_BANNED' || !isAppeal) {
        clearUserSession();
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams();
          params.set('accountStatus', data.code);
          if (data.reason) params.set('reason', data.reason);
          if (data.until) params.set('until', data.until);
          window.location.href = `/login?${params.toString()}`;
        }
      }
    }

    throw error;
  }

  return data;
}
