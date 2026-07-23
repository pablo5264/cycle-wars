alter table public.shop_items
  add column if not exists rarity text not null default 'common'
    check (rarity in ('common', 'rare', 'epic', 'legendary')),
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists sort_order integer not null default 1000,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add constraint shop_items_cosmetic_only
    check (kind in ('skin', 'theme', 'animation', 'emblem', 'frame', 'virtual_bike', 'flag', 'avatar'));

create or replace view public.v_shop_catalog as
select
  si.id,
  si.code,
  si.kind,
  si.name,
  si.description,
  si.price_currency,
  si.price_amount,
  si.asset_path,
  si.rarity,
  si.metadata,
  si.sort_order,
  si.is_active,
  si.created_at
from public.shop_items si
where si.is_active
  and (si.starts_at is null or si.starts_at <= now())
  and (si.ends_at is null or si.ends_at > now());

create or replace view public.v_player_inventory as
select
  pi.player_id,
  pi.item_id,
  si.code,
  si.kind,
  si.name,
  si.description,
  si.asset_path,
  si.rarity,
  pi.acquired_at,
  pi.equipped_at,
  (pi.equipped_at is not null) as is_equipped
from public.player_inventory pi
join public.shop_items si on si.id = pi.item_id;

insert into public.shop_items (
  code,
  kind,
  name,
  description,
  price_currency,
  price_amount,
  asset_path,
  rarity,
  metadata,
  sort_order
)
values
  ('neon_frame_green', 'frame', 'Marco Neon Verde', 'Marco cosmético para perfil y conquistas.', 'coins', 1200, 'cosmetics/frames/neon_green.png', 'rare', '{"antiPayToWin": true}', 10),
  ('voltage_route_trail', 'animation', 'Estela Voltaje', 'Efecto visual para rutas compartidas.', 'crystals', 80, 'cosmetics/animations/voltage.json', 'epic', '{"antiPayToWin": true}', 20),
  ('city_banner', 'flag', 'Bandera Ciudad', 'Bandera visible en territorios conquistados.', 'coins', 900, 'cosmetics/flags/city_banner.png', 'common', '{"antiPayToWin": true}', 30),
  ('carbon_virtual_bike', 'virtual_bike', 'Bicicleta Carbono Virtual', 'Bicicleta visual para el perfil.', 'crystals', 140, 'cosmetics/bikes/carbon.glb', 'legendary', '{"antiPayToWin": true}', 40),
  ('aurora_theme', 'theme', 'Tema Aurora', 'Tema visual oscuro con acentos verdes.', 'coins', 2000, 'cosmetics/themes/aurora.json', 'epic', '{"antiPayToWin": true}', 50)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    price_currency = excluded.price_currency,
    price_amount = excluded.price_amount,
    asset_path = excluded.asset_path,
    rarity = excluded.rarity,
    metadata = excluded.metadata,
    sort_order = excluded.sort_order,
    is_active = true;

create or replace function public.equip_inventory_item(
  p_player_id uuid,
  p_item_id uuid
)
returns public.player_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  item_kind public.inventory_item_kind;
  row_value public.player_inventory;
begin
  select si.kind
  into item_kind
  from public.player_inventory pi
  join public.shop_items si on si.id = pi.item_id
  where pi.player_id = p_player_id
    and pi.item_id = p_item_id;

  if item_kind is null then
    raise exception 'Item is not owned by player';
  end if;

  update public.player_inventory pi
  set equipped_at = null
  from public.shop_items si
  where pi.item_id = si.id
    and pi.player_id = p_player_id
    and si.kind = item_kind;

  update public.player_inventory
  set equipped_at = now()
  where player_id = p_player_id
    and item_id = p_item_id
  returning * into row_value;

  return row_value;
end;
$$;

create or replace function public.grant_currency(
  p_player_id uuid,
  p_currency public.currency_kind,
  p_amount bigint,
  p_reason text,
  p_reference_type text,
  p_reference_id uuid
)
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  row_value public.wallets;
begin
  if p_amount <= 0 then
    raise exception 'Grant amount must be positive';
  end if;

  insert into public.wallets (player_id, currency, balance)
  values (p_player_id, p_currency, p_amount)
  on conflict (player_id, currency) do update
  set balance = public.wallets.balance + excluded.balance,
      updated_at = now()
  returning * into row_value;

  insert into public.economy_ledger (
    player_id,
    currency,
    amount,
    reason,
    reference_type,
    reference_id
  )
  values (
    p_player_id,
    p_currency,
    p_amount,
    p_reason,
    p_reference_type,
    p_reference_id
  );

  return row_value;
end;
$$;

revoke execute on function public.equip_inventory_item(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.grant_currency(uuid, public.currency_kind, bigint, text, text, uuid) from public, anon, authenticated;

grant execute on function public.equip_inventory_item(uuid, uuid) to service_role;
grant execute on function public.grant_currency(uuid, public.currency_kind, bigint, text, text, uuid) to service_role;
