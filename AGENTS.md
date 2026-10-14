# Architecture rules

- Signed-in navigation groups modules into the same playbook work areas used by the dashboard, so discovery stays consistent.
- Communication screens share `ChannelHeader` and `/communications` as the parent workspace, keeping SMS and WhatsApp sibling channels.
- Message usage is derived from persisted per-recipient logs, while provider balances are refreshed after successful sends.
- Theme selection follows the visitor's local time (light 06:00–17:59, dark otherwise), with all surfaces consuming semantic theme tokens.

- MCP tools share a lazy caller-token database factory; handlers enforce module permissions and owned events because admin/check-in RLS can read other owners' rows.
- ChatGPT SMS actions save immutable expiring drafts; only a non-OAuth human session can atomically claim a draft in the review screen, preventing agent self-approval and replay sends.
- Uncertain sends remain reserved and never auto-retry; the confirmation sender reuses send-sms and its per-recipient logs to avoid duplicate delivery.
- Browser assistant tools remain read-only on the SMS confirmation screen so they cannot bypass its human send control.
