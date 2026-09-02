VELORIAN BANK — CLIENT PORTAL FIX

This build fixes the client portal JavaScript initialization issue that prevented the dashboard from rendering the logged-in client's data and prevented controls such as Sign out and Change password from working.

FIXES INCLUDED
- Client name loads from the active client session.
- Account number loads from the active client session.
- Client-specific currency and balance render correctly.
- Client transaction history renders from the centralized state.
- Administrator-posted deposits/withdrawals/transfers appear in the client portal.
- Sign out clears the client session and returns to Client Login.
- Change Password modal and form work correctly.
- Optional transfer-related elements no longer crash the client dashboard when they are not present.
- Transaction amounts use the transaction's recorded currency.
- Removed the visible "Prototype" wording from the client portal footer.

IMPORTANT
This remains a browser/localStorage prototype and should not be used for real financial transactions or real customer data. A production system requires a secure backend, database, server-side authorization, password hashing, audit logging, HTTPS, CSRF protection, rate limiting, MFA and other controls.

TESTING
1. Open admin-login.html.
2. Sign in as administrator.
3. Create a client and assign an initial balance if desired.
4. Post a deposit or withdrawal from the administrator portal.
5. Open client-login.html in the same browser.
6. Sign in with the client's account number and password.
7. Confirm the client's name, account number, balance and transactions appear.
8. Test Sign out and Change password.
