# Economy

Phase 9 implements the cosmetic economy.

## Implemented

- Coins and crystals wallets.
- Cosmetic shop catalog through `v_shop_catalog`.
- Player inventory through `v_player_inventory`.
- Atomic purchase through `purchase_shop_item`.
- Equip one item per cosmetic kind through `equip_inventory_item`.
- Internal currency grants through `grant_currency`.
- Economy ledger for every currency movement.
- Seed cosmetic catalog.
- Mobile shop with wallet, catalog, inventory, equip and ledger.

## Anti Pay-To-Win

The database enforces cosmetic-only shop kinds:

- skin
- theme
- animation
- emblem
- frame
- virtual bike
- flag
- avatar

Shop items cannot grant distance, speed, influence, battle score, shield power or conquest advantage.

## Server Authority

Purchases and grants are server-side:

- `purchase-shop-item` validates wallet balance and avoids double-charging owned items.
- `equip-item` validates ownership before equipping.
- `grant-currency` requires the internal service secret.

## Ledger

Every coin/crystal change is written to `economy_ledger`, giving support, fraud review and analytics a full audit trail.
