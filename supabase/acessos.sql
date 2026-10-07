-- Construtora JR — gerenciar acessos pelo app (rode inteiro no SQL Editor do Supabase, uma vez,
-- depois do banco.sql). Só quem é ADMINISTRADOR consegue usar estas funções.
-- Papéis: 'admin' = Administrador (lança e altera) · 'leitor' = Visualizador (só consulta).

alter table public.jr_perfis add column if not exists nome text;

-- garante que quem chama é administrador
create or replace function public.jr_exigir_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if public.jr_papel() is distinct from 'admin' then
    raise exception 'Somente o administrador pode gerenciar acessos';
  end if;
end $$;

-- lista todos os acessos
create or replace function public.jr_listar_acessos()
returns table (user_id uuid, email text, nome text, papel text, criado_em timestamptz, ultimo_acesso timestamptz)
language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.jr_exigir_admin();
  return query
    select p.user_id, coalesce(p.email, u.email)::text, p.nome, p.papel, u.created_at, u.last_sign_in_at
    from public.jr_perfis p join auth.users u on u.id = p.user_id
    order by (p.papel = 'admin') desc, coalesce(p.nome, p.email);
end $$;

-- cria um acesso novo (e-mail + senha), já confirmado, sem mandar e-mail
create or replace function public.jr_criar_acesso(p_email text, p_senha text, p_nome text, p_papel text)
returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  novo uuid := gen_random_uuid();
  mail text := lower(trim(p_email));
begin
  perform public.jr_exigir_admin();
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido'; end if;
  if length(coalesce(p_senha, '')) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres'; end if;
  if p_papel not in ('admin', 'leitor') then raise exception 'Tipo de acesso inválido'; end if;
  if exists (select 1 from auth.users where lower(email) = mail) then raise exception 'Este e-mail já tem acesso'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', novo, 'authenticated', 'authenticated', mail,
    extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('nome', p_nome), now(), now(),
    '', '', '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), novo, novo::text,
    jsonb_build_object('sub', novo::text, 'email', mail, 'email_verified', true), 'email', now(), now(), now());

  -- o gatilho jr_novo_usuario já criou o perfil; aqui define nome e papel
  insert into public.jr_perfis (user_id, email, nome, papel) values (novo, mail, nullif(trim(p_nome), ''), p_papel)
  on conflict (user_id) do update set email = excluded.email, nome = excluded.nome, papel = excluded.papel;
  return novo;
end $$;

-- edita nome, papel e (se informada) a senha
create or replace function public.jr_editar_acesso(p_user uuid, p_nome text, p_papel text, p_senha text)
returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  perform public.jr_exigir_admin();
  if p_papel not in ('admin', 'leitor') then raise exception 'Tipo de acesso inválido'; end if;
  if p_papel = 'leitor' and (select papel from public.jr_perfis where user_id = p_user) = 'admin'
     and (select count(*) from public.jr_perfis where papel = 'admin') <= 1 then
    raise exception 'Precisa existir pelo menos um administrador';
  end if;
  if coalesce(p_senha, '') <> '' then
    if length(p_senha) < 6 then raise exception 'A senha precisa ter pelo menos 6 caracteres'; end if;
    update auth.users set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now()
    where id = p_user;
  end if;
  update public.jr_perfis set nome = nullif(trim(p_nome), ''), papel = p_papel where user_id = p_user;
end $$;

-- exclui o acesso (a pessoa não consegue mais entrar)
create or replace function public.jr_excluir_acesso(p_user uuid)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.jr_exigir_admin();
  if p_user = auth.uid() then raise exception 'Você não pode excluir o seu próprio acesso'; end if;
  if (select papel from public.jr_perfis where user_id = p_user) = 'admin'
     and (select count(*) from public.jr_perfis where papel = 'admin') <= 1 then
    raise exception 'Precisa existir pelo menos um administrador';
  end if;
  delete from auth.users where id = p_user; -- o perfil sai junto (on delete cascade)
end $$;

revoke all on function public.jr_exigir_admin(), public.jr_listar_acessos(),
  public.jr_criar_acesso(text, text, text, text), public.jr_editar_acesso(uuid, text, text, text),
  public.jr_excluir_acesso(uuid) from public, anon;
grant execute on function public.jr_listar_acessos(), public.jr_criar_acesso(text, text, text, text),
  public.jr_editar_acesso(uuid, text, text, text), public.jr_excluir_acesso(uuid) to authenticated;
