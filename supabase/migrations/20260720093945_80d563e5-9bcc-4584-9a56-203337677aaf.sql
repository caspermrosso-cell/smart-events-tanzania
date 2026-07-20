alter view public.event_testimonials set (security_invoker = true);

create policy "Public can view featured events"
on public.events
for select
to anon
using (show_on_website = true);

grant select on public.events to anon;