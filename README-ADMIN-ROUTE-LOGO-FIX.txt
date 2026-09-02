VELORIAN BANK — ADMIN ROUTE + LOGIN LOGO FIX

Changes in this build:
1. The client login page no longer displays the large Velorian Bank logo on the left side.
2. The administrator login page also no longer displays the large Velorian Bank logo on the left side.
3. The administrator login redirect is fixed. After valid admin credentials, the login now correctly opens ../control-center/index.html instead of incorrectly looking for control-center/control-center/index.html.
4. The administrator control center remains protected by the admin session guard.
5. The public homepage continues to expose only the Client Login route; the administrator portal remains on its separate private route.

ADMIN ROUTE:
Open: control-center/login.html

IMPORTANT:
This is still a front-end/browser prototype using localStorage/sessionStorage. It is not suitable for handling real money or real banking credentials without a secure backend, database, server-side authentication/authorization, audit logging, encryption and transactional APIs.
