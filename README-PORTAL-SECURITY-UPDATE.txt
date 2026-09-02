VELORIAN BANK — PORTAL SEPARATION UPDATE
========================================

This package includes:

1. The supplied customer banking image is now the homepage background.
2. Administrator and Client portals are separated by a browser-side role guard.
3. admin.html requires an active Administrator session and redirects unauthorized visitors to admin-login.html.
4. client.html and client-first-login.html require an active Client session and redirect unauthorized visitors to client-login.html.
5. The Administrator dashboard remains a separate page from the Client dashboard.
6. The existing administrator-controlled deposits, withdrawals and transaction history are preserved.

IMPORTANT
---------
This is still a front-end/browser prototype. LocalStorage/sessionStorage authentication is NOT sufficient for a real financial institution. A production banking system must enforce authentication and authorization on a secure server/API, use a real database, HTTPS, password hashing, MFA, audit controls, rate limiting, CSRF/session protection and other appropriate security controls.
