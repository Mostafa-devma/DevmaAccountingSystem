# Devma Accounting System

POS, rooms, inventory, production and double-entry accounting in one offline web app.

## Run
Double-click `index.html` (Chrome / Edge). No install or server needed. Data is saved in the browser; use **Backup** to move it to another PC.

**Arabic / English:** use the `العربية` button on the login screen, the `ع / EN` button in the top bar, or Settings → Appearance → Language. Arabic switches the whole interface to right-to-left, including printed invoices and receipts.

First login: `admin / admin` — change the password from the user menu. The system starts empty; to explore with sample data use **Backup → Load demo data (for training)**.

## Structure
- `js/db.js` — data store, posting engine (ledger + stock), demo data
- `js/ui.js` — tables, modals, printing, formatting
- `js/app.js` — login, shell, sidebar, router, search, notifications
- `js/views/*` — one file per module group
- `css/style.css` — themes (Emerald, Plum, Forest, Graphite) + dark mode
