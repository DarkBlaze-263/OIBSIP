// Shared auth helpers if needed
window.authAPI = {
  me: () => fetch('/api/me').then(r => r.ok ? r.json() : null),
  logout: () => fetch('/api/logout', { method: 'POST' })
};
