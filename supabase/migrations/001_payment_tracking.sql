create extension if not exists pgcrypto;

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  admin_token text not null unique,
  title text,
  receipt_image_url text null,
  items_json jsonb not null,
  people_json jsonb not null,
  assignments_json jsonb not null,
  tax_rate numeric not null default 0,
  service_rate numeric not null default 0,
  discount_amount numeric not null default 0,
  assigned_subtotal numeric not null default 0,
  total_discount_amount numeric not null default 0,
  total_service_amount numeric not null default 0,
  total_tax_amount numeric not null default 0,
  grand_total numeric not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bills_status_check check (status in ('open', 'closed'))
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  person_id text not null,
  person_name text not null,
  expected_amount numeric not null,
  paid_amount numeric null,
  proof_object_key text null,
  proof_file_name text null,
  proof_content_type text null,
  note text null,
  status text not null default 'pending',
  uploaded_at timestamptz null,
  verified_at timestamptz null,
  rejected_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_proofs_bill_person_unique unique (bill_id, person_id),
  constraint payment_proofs_status_check check (status in ('pending', 'uploaded', 'verified', 'rejected'))
);

create index if not exists payment_proofs_bill_id_idx on public.payment_proofs(bill_id);
create index if not exists payment_proofs_status_idx on public.payment_proofs(status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_bills_updated_at on public.bills;
create trigger set_bills_updated_at
before update on public.bills
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_proofs_updated_at on public.payment_proofs;
create trigger set_payment_proofs_updated_at
before update on public.payment_proofs
for each row execute function public.set_updated_at();
