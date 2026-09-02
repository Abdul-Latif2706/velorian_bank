VELORIAN BANK — NAVIGATION LAYOUT FIX

This package fixes the duplicated/plain-text navigation that was appearing under the main navigation on desktop.

WHAT WAS FIXED
1. The mobile navigation is now hidden on desktop and only appears when the mobile menu is opened.
2. The desktop navigation remains on one clean line with the Velorian logo on the left.
3. The logo was cropped and converted to a transparent PNG so the old white rectangle does not appear on the dark header.
4. Responsive behavior is preserved for tablets and phones.
5. All original banking pages, backgrounds, JavaScript, and other project files are retained.

OPENING
Extract the ZIP and open index.html with Live Server.


PASSWORD WORKFLOW UPDATE
- New clients are marked as requiring a password change.
- Client first login redirects to client-first-login.html.
- Temporary password must be replaced before client.html is accessible.
- Clients can later change their password from the dashboard.
- Admin password reset creates a new temporary password and requires a new password on next login.
