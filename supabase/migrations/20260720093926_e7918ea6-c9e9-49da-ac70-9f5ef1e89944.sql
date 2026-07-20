alter table public.events add column if not exists show_on_website boolean not null default false;

grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;

create or replace view public.event_testimonials as
select
  id,
  title,
  event_type,
  event_date,
  venue,
  description,
  photo_url,
  status,
  created_at
from public.events
where show_on_website = true
order by event_date desc;

grant select on public.event_testimonials to anon;
grant select on public.event_testimonials to authenticated;