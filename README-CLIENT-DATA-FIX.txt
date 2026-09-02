VELORIAN BANK — CLIENT DATA FIX

This version fixes client dashboard data binding. After an administrator creates a client, the client portal resolves the logged-in client by both client ID and account number, so the name, account number, balance, currency and transaction history render correctly.

It also normalizes older browser state before reading client/transaction arrays, preventing legacy localStorage from stopping the dashboard JavaScript.

The administrator remains the only role allowed to post deposits, withdrawals and transfers. Clients remain read-only for money movement but can view their complete account history and change their password.

Front-end prototype only; do not use browser storage for real financial services.
