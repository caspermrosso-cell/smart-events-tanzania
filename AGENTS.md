# Architecture rules

- Signed-in navigation groups modules into the same playbook work areas used by the dashboard, so discovery stays consistent.
- Communication screens share `ChannelHeader` and `/communications` as the parent workspace, keeping SMS and WhatsApp sibling channels.
- Message usage is derived from persisted per-recipient logs, while provider balances are refreshed after successful sends.
- Theme selection follows the visitor's local time (light 06:00–17:59, dark otherwise) and both modes use the Smart Events logo's navy, gold, and warm ivory palette.
