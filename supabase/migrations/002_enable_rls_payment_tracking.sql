-- Enable row level security for payment tracking tables.
--
-- This app intentionally accesses Supabase only from the Express API server
-- using SUPABASE_SERVICE_ROLE_KEY. Browser clients should not read or write
-- these tables directly because rows contain bill details, participant names,
-- payment proof metadata, and admin tokens.

alter table public.bills enable row level security;
alter table public.payment_proofs enable row level security;

revoke all on table public.bills from anon;
revoke all on table public.bills from authenticated;
revoke all on table public.payment_proofs from anon;
revoke all on table public.payment_proofs from authenticated;

grant usage on schema public to service_role;
grant all on table public.bills to service_role;
grant all on table public.payment_proofs to service_role;

drop policy if exists "service role can manage bills" on public.bills;
create policy "service role can manage bills"
on public.bills
as permissive
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role can manage payment proofs" on public.payment_proofs;
create policy "service role can manage payment proofs"
on public.payment_proofs
as permissive
for all
to service_role
using (true)
with check (true);

comment on table public.bills is 'Saved split bill records. RLS enabled; access is mediated by the API server using service_role.';
comment on table public.payment_proofs is 'Per-person payment proof tracking rows. RLS enabled; access is mediated by the API server using service_role.';
