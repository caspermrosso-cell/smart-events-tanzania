import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEvents from "./tools/list-events";
import listGuests from "./tools/list-guests";
import listPledges from "./tools/list-pledges";
import eventSummary from "./tools/event-summary";
import listInvoices from "./tools/list-invoices";

import addGuests from "./tools/add-guests";
import prepareSms from "./tools/prepare-event-sms";
import getSmsDraft from "./tools/get-sms-draft";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "smart-events-tanzania",
  title: "Smart Events Tanzania",
  version: "0.2.0",
  instructions:
    "Tools for the Smart Events Tanzania platform. Read the signed-in user's events, guests, pledges, invoices, and per-event summaries. Add guests and prepare SMS drafts for owned events with module permissions. Never claim a prepared SMS was sent. Ask the user to open the review link and explicitly confirm in Smart Events; only that human confirmation can transmit messages. Read draft status to check the result. All calls are scoped to the authenticated user via row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
    requireOAuthClientClaim: true,
  }),
  tools: [listEvents, listGuests, listPledges, eventSummary, listInvoices, addGuests, prepareSms, getSmsDraft],
});