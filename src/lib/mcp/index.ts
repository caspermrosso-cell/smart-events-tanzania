import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEvents from "./tools/list-events";
import listGuests from "./tools/list-guests";
import listPledges from "./tools/list-pledges";
import eventSummary from "./tools/event-summary";
import listInvoices from "./tools/list-invoices";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "smart-events-mcp",
  title: "Smart Events",
  version: "0.1.0",
  instructions:
    "Tools for the Smart Events Tanzania platform. Read the signed-in user's events, guests, pledges, invoices, and per-event summaries. All calls are scoped to the authenticated user via row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listEvents, listGuests, listPledges, eventSummary, listInvoices],
});