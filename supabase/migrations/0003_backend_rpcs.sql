create or replace function public.active_season_id()
returns uuid
language sql
stable
as $$
  select id
  from public.seasons
  where status = 'active'
    and starts_at <= now()
    and ends_at > now()
  order by starts_at desc
  limit 1
$$;

create or replace function public.apply_territory_influence(
  p_h3_index text,
  p_player_id uuid,
  p_clan_id uuid,
  p_activity_id uuid,
  p_influence_delta integer,
  p_distance_meters numeric,
  p_shield_minutes integer,
  p_now timestamptz
)
returns public.territories
language plpgsql
security definer
set search_path = public
as $$
declare
  current_territory public.territories;
  updated_territory public.territories;
  current_season_id uuid;
  next_shield_until timestamptz;
begin
  if p_influence_delta <= 0 then
    raise exception 'Influence delta must be positive';
  end if;

  current_season_id := public.active_season_id();

  insert into public.territories (
    h3_index,
    owner_id,
    clan_id,
    captured_at,
    influence_points,
    level,
    shield_until,
    color,
    status,
    season_id
  )
  values (
    p_h3_index,
    null,
    null,
    null,
    0,
    1,
    null,
    '#7A8794',
    'neutral',
    current_season_id
  )
  on conflict (h3_index) do nothing;

  select *
  into current_territory
  from public.territories
  where h3_index = p_h3_index
  for update;

  insert into public.territory_influence_events (
    territory_h3_index,
    activity_id,
    player_id,
    clan_id,
    season_id,
    influence_delta,
    distance_meters,
    occurred_at
  )
  values (
    p_h3_index,
    p_activity_id,
    p_player_id,
    p_clan_id,
    current_season_id,
    p_influence_delta,
    p_distance_meters,
    p_now
  );

  if current_territory.shield_until is not null and current_territory.shield_until > p_now then
    update public.territories
    set status = 'protected',
        updated_at = p_now
    where h3_index = p_h3_index
    returning * into updated_territory;

    return updated_territory;
  end if;

  if current_territory.owner_id = p_player_id then
    update public.territories
    set influence_points = influence_points + p_influence_delta,
        status = 'vulnerable',
        season_id = coalesce(season_id, current_season_id),
        updated_at = p_now
    where h3_index = p_h3_index
    returning * into updated_territory;

    return updated_territory;
  end if;

  if p_influence_delta > current_territory.influence_points then
    next_shield_until := p_now + make_interval(mins => greatest(p_shield_minutes, 0));

    insert into public.territory_ownership_history (
      territory_h3_index,
      previous_owner_id,
      new_owner_id,
      previous_clan_id,
      new_clan_id,
      season_id,
      changed_at,
      reason
    )
    values (
      p_h3_index,
      current_territory.owner_id,
      p_player_id,
      current_territory.clan_id,
      p_clan_id,
      current_season_id,
      p_now,
      'conquest'
    );

    update public.territories
    set owner_id = p_player_id,
        clan_id = p_clan_id,
        captured_at = p_now,
        influence_points = p_influence_delta,
        shield_until = next_shield_until,
        status = 'protected',
        season_id = current_season_id,
        color = coalesce((select color from public.clans where id = p_clan_id), '#39E58C'),
        updated_at = p_now
    where h3_index = p_h3_index
    returning * into updated_territory;

    insert into public.notifications (player_id, kind, title, body, payload)
    values (
      p_player_id,
      'territory_won',
      'Territory conquered',
      'Your ride captured a territory.',
      jsonb_build_object('h3Index', p_h3_index)
    );

    if current_territory.owner_id is not null then
      insert into public.notifications (player_id, kind, title, body, payload)
      values (
        current_territory.owner_id,
        'territory_lost',
        'Territory lost',
        'Another rider overcame your influence.',
        jsonb_build_object('h3Index', p_h3_index, 'newOwnerId', p_player_id)
      );
    end if;

    update public.player_profiles
    set stats = jsonb_set(
          stats,
          '{conquests}',
          to_jsonb(coalesce((stats ->> 'conquests')::integer, 0) + 1)
        )
    where id = p_player_id;

    return updated_territory;
  end if;

  update public.territories
  set status = 'contested',
      updated_at = p_now
  where h3_index = p_h3_index
  returning * into updated_territory;

  insert into public.notifications (player_id, kind, title, body, payload)
  select owner_id,
         'territory_attacked',
         'Territory under attack',
         'A rider is building influence in your territory.',
         jsonb_build_object('h3Index', p_h3_index, 'challengerId', p_player_id)
  from public.territories
  where h3_index = p_h3_index
    and owner_id is not null
    and owner_id <> p_player_id;

  return updated_territory;
end;
$$;

create or replace function public.purchase_shop_item(
  p_player_id uuid,
  p_item_id uuid
)
returns public.player_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.shop_items;
  wallet_balance bigint;
  inventory_row public.player_inventory;
  already_owned boolean;
begin
  select *
  into item
  from public.shop_items
  where id = p_item_id
    and is_active
  for update;

  if item.id is null then
    raise exception 'Shop item is not available';
  end if;

  select exists (
    select 1
    from public.player_inventory
    where player_id = p_player_id
      and item_id = p_item_id
  )
  into already_owned;

  if already_owned then
    select *
    into inventory_row
    from public.player_inventory
    where player_id = p_player_id
      and item_id = p_item_id;

    return inventory_row;
  end if;

  select balance
  into wallet_balance
  from public.wallets
  where player_id = p_player_id
    and currency = item.price_currency
  for update;

  if wallet_balance is null or wallet_balance < item.price_amount then
    raise exception 'Insufficient balance';
  end if;

  update public.wallets
  set balance = balance - item.price_amount,
      updated_at = now()
  where player_id = p_player_id
    and currency = item.price_currency;

  insert into public.player_inventory (player_id, item_id)
  values (p_player_id, p_item_id)
  returning * into inventory_row;

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
    item.price_currency,
    -item.price_amount,
    'shop_purchase',
    'shop_items',
    item.id
  );

  return inventory_row;
end;
$$;

create or replace function public.resolve_battle(
  p_battle_id uuid,
  p_now timestamptz
)
returns public.battles
language plpgsql
security definer
set search_path = public
as $$
declare
  winner uuid;
  battle_row public.battles;
begin
  select player_id
  into winner
  from public.battle_participants
  where battle_id = p_battle_id
  order by score desc, distance_meters desc, time_in_territory_seconds desc, joined_at asc
  limit 1;

  if winner is null then
    raise exception 'Battle has no participants';
  end if;

  update public.battles
  set status = 'resolved',
      ended_at = p_now,
      winner_id = winner,
      metrics = jsonb_build_object(
        'resolvedBy', 'server',
        'participantCount', (
          select count(*) from public.battle_participants where battle_id = p_battle_id
        )
      )
  where id = p_battle_id
  returning * into battle_row;

  update public.player_profiles
  set stats = jsonb_set(
        stats,
        '{wins}',
        to_jsonb(coalesce((stats ->> 'wins')::integer, 0) + 1)
      )
  where id = winner;

  update public.player_profiles
  set stats = jsonb_set(
        stats,
        '{losses}',
        to_jsonb(coalesce((stats ->> 'losses')::integer, 0) + 1)
      )
  where id in (
    select player_id
    from public.battle_participants
    where battle_id = p_battle_id
      and player_id <> winner
  );

  insert into public.notifications (player_id, kind, title, body, payload)
  select
    player_id,
    'battle_result',
    case when player_id = winner then 'Battle won' else 'Battle lost' end,
    case when player_id = winner then 'You won the territory battle.' else 'Your rival won the territory battle.' end,
    jsonb_build_object('battleId', p_battle_id, 'winnerId', winner)
  from public.battle_participants
  where battle_id = p_battle_id;

  return battle_row;
end;
$$;

create or replace function public.refresh_rankings()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.mv_clan_rankings;
  refresh materialized view public.mv_player_rankings;
end;
$$;

revoke execute on function public.apply_territory_influence(text, uuid, uuid, uuid, integer, numeric, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.purchase_shop_item(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.resolve_battle(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.refresh_rankings() from public, anon, authenticated;

grant execute on function public.apply_territory_influence(text, uuid, uuid, uuid, integer, numeric, integer, timestamptz) to service_role;
grant execute on function public.purchase_shop_item(uuid, uuid) to service_role;
grant execute on function public.resolve_battle(uuid, timestamptz) to service_role;
grant execute on function public.refresh_rankings() to service_role;
