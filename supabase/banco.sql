-- Construtora JR — banco no Supabase (rode inteiro no SQL Editor, uma vez)
-- Dados do app = uma linha em jr_dados. Quem pode o quê fica em jr_perfis.

create table if not exists public.jr_dados (
  id int primary key default 1 check (id = 1),
  dados jsonb not null,
  versao int not null default 1,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id)
);

create table if not exists public.jr_perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  papel text not null default 'leitor' check (papel in ('admin','leitor'))
);

-- todo usuário novo vira LEITOR; o primeiro de todos vira ADMINISTRADOR
create or replace function public.jr_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.jr_perfis (user_id, email, papel)
  values (new.id, new.email,
    case when exists (select 1 from public.jr_perfis where papel = 'admin') then 'leitor' else 'admin' end);
  return new;
end $$;

drop trigger if exists jr_novo_usuario on auth.users;
create trigger jr_novo_usuario after insert on auth.users
  for each row execute function public.jr_novo_usuario();

-- usuários que já existirem antes deste script
insert into public.jr_perfis (user_id, email, papel)
select u.id, u.email, 'leitor' from auth.users u
on conflict do nothing;

create or replace function public.jr_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.jr_perfis where user_id = auth.uid()
$$;

alter table public.jr_dados enable row level security;
alter table public.jr_perfis enable row level security;

drop policy if exists jr_dados_ler on public.jr_dados;
create policy jr_dados_ler on public.jr_dados for select to authenticated
  using (public.jr_papel() in ('admin','leitor'));

drop policy if exists jr_dados_inserir on public.jr_dados;
create policy jr_dados_inserir on public.jr_dados for insert to authenticated
  with check (public.jr_papel() = 'admin');

drop policy if exists jr_dados_alterar on public.jr_dados;
create policy jr_dados_alterar on public.jr_dados for update to authenticated
  using (public.jr_papel() = 'admin') with check (public.jr_papel() = 'admin');

drop policy if exists jr_perfis_ler on public.jr_perfis;
create policy jr_perfis_ler on public.jr_perfis for select to authenticated
  using (user_id = auth.uid() or public.jr_papel() = 'admin');

-- Para tornar alguém administrador (ou voltar a leitor):
--   update public.jr_perfis set papel = 'admin' where email = 'fulano@exemplo.com';
