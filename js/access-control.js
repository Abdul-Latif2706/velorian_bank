/* Velorian Bank — browser prototype portal access guard.
   Public client pages and private administrator pages use separate routes. */
(function () {
  const path = (location.pathname || '').toLowerCase();
  const parts = path.split('/').filter(Boolean);
  const page = parts[parts.length - 1] || '';
  const inAdmin = parts.includes('control-center');
  const inClient = parts.includes('client');
  const session = typeof vbGetSession === 'function' ? vbGetSession() : null;

  if (inAdmin && (page === 'index.html' || page === 'portal.html')) {
    if (!session || session.role !== 'admin') {
      location.replace('login.html');
      return;
    }
  }
  if (inClient && (page === 'index.html' || page === 'first-login.html')) {
    if (!session || session.role !== 'client') {
      location.replace('../client-login.html');
      return;
    }
  }
})();
