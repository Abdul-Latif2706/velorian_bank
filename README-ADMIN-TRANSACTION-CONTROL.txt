VELORIAN BANK — ADMINISTRATOR TRANSACTION CONTROL UPDATE

Changes in this build:
1. Client portal no longer displays Deposit, Withdrawal, or Transfer controls.
2. Client portal remains read-only for financial activity: clients can view balances and transaction history and change their password.
3. Deposits and withdrawals can only be posted from the Administrator portal.
4. Internal transfers are also administrator-only. Existing transfer history remains visible to the relevant clients.
5. Administrator portal now has a "Post transaction" control in System Transactions.
6. Administrator can select a client, choose Deposit / Withdrawal / Internal transfer, enter amount, status and description.
7. Successful deposits/withdrawals update the client's balance. Pending/Failed entries are recorded without changing the balance.
8. All transaction activity continues to use the shared browser state, so the same transaction history is visible in both portals.
9. The storage layer also rejects direct client-side calls to post deposits, withdrawals or transfers unless an administrator session is active.

IMPORTANT:
This remains a front-end/browser prototype. localStorage/sessionStorage are not suitable for real financial production systems. A real deployment requires a secure server, database, authentication, authorization, audit logging, encryption, fraud controls and transactional APIs.
