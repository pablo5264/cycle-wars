# Social System

Phase 8 implements the social layer for Cycle Wars.

## Implemented

- Feed reads through `v_feed_posts`.
- Create public/friends/clan/private feed posts.
- Likes with toggle behavior.
- Comments.
- Friend requests with notification.
- Follow/unfollow.
- Private chat thread creation.
- Clan chat thread creation.
- Chat messages.
- Notification inbox.
- Mobile Social tab with feed, publishing, notifications and private chat.
- Social publish action busy label.
- Social tab unread notification badge.
- Notification inbox manual refresh action.
- Notification inbox refresh timestamp.
- Notification inbox refresh-in-progress label.
- Notification inbox unread-first and newest-first sorting.
- Notification inbox visible count for filtered results.
- Notification inbox show-more action for longer filtered lists.
- Notification inbox visible limit reset when filters or refresh change.
- Notification inbox read status labels.
- Notification inbox received timestamp labels.
- Notification inbox active category filter state.
- Notification inbox active filter count.
- Notification inbox clear filters action.
- Notification filter reset after bulk read actions.
- Notification inbox readable filter summary.
- Notification inbox total, pending and read summary.
- Notification inbox unread filter disabled state when no pending alerts remain.
- Notification inbox empty state with last refresh context.
- Notification inbox filtered empty guidance.
- Notification inbox refined filtered empty copy.
- Notification inbox item separators for mobile scanning.
- Notification inbox unread item accent.
- Notification inbox read time labels.
- Notification inbox latest alert summary.
- Notification inbox oldest pending summary.
- Notification inbox show-fewer action after expansion.
- Notification inbox oldest pending quick-read action.
- Notification inbox newest pending quick-read action.
- Notification inbox quick-read action dedupe.
- Notification inbox quick-read row layout.
- Notification inbox quick-read guidance copy.
- Notification inbox quick-read busy guard.
- Notification inbox read actions busy guard.
- Notification inbox read actions busy labels.
- Notification inbox filter busy guard.
- Notification inbox pagination busy guard.
- Notification inbox read actions for one item or all unread items.
- Notification inbox unread-only filter.
- Notification inbox kind labels for faster scanning.
- Notification inbox unread category summary.
- Notification inbox category filter actions.
- Route and conquest sharing.

## Server Authority

Social writes use Edge Functions and RPCs:

- `create_feed_post`
- `toggle_feed_like`
- `add_feed_comment`
- `request_friendship`
- `set_follow`
- `ensure_private_chat`
- `ensure_clan_chat`
- `send_chat_message`
- `share_activity_post`
- `share_conquest_post`

This keeps multi-table writes consistent and avoids client-side coordination for notifications or chat membership.

## Realtime

The tables `feed_posts`, `feed_likes`, `feed_comments`, `chat_messages` and `notifications` are already published through Supabase Realtime. A later polish pass can subscribe the Social tab live, but the data model and backend are ready.

## Privacy

RLS policies limit friendships, chats and notifications to the involved users. Public feed remains readable for game discovery.

## Sharing

Posts support optional `activity_id` and `territory_h3_index`, so routes and conquests can be shared without duplicating activity or territory data. Dedicated endpoints now validate ownership before publishing route or conquest posts.

## Clan Governance

Phase 20 adds server-authoritative clan governance:

- Leaders can manage all non-self member role changes and removals.
- Captains can manage veterans, members and recruits, but cannot promote to captain or leader.
- Leader transfer is intentionally excluded from the generic endpoint.
- Every governance mutation is recorded in `clan_governance_audit`.
- `manage-clan-member` exposes the flow to authenticated clients while SQL RPCs enforce the rules.
- `clan-governance-audit` exposes recent governance history to clan members through a read-only server endpoint.

## Clan Invitations

Phase 22 adds server-authoritative clan invitations:

- Leaders and captains can invite riders who do not already belong to a clan.
- Pending invitations expire automatically when the response RPC sees they are stale.
- Accepting an invitation creates the clan membership and updates the rider profile in one transaction.
- Declining keeps the audit trail through invitation status and response timestamps.
- `clan-invitations` exposes received and sent invitations to authenticated clients.

## Clan Join Requests

Phase 23 adds clan discovery and join requests:

- Riders can browse a read-only clan directory with membership counts and join policy.
- Open clans accept requests immediately if capacity allows.
- Approval-required clans create pending requests for leaders and captains.
- Invite-only clans stay closed to public requests.
- Approvals create membership and update the rider profile atomically.
- `clan-join-requests` exposes directory, sent requests and pending received requests.

## Clan Creation

Phase 24 adds server-authoritative clan founding:

- Riders without a clan can create a new clan.
- The creator becomes leader immediately.
- Clan slug generation is deterministic and collision-safe.
- Pending join requests and received invitations are closed when a rider founds a clan.
- `create-clan` exposes the flow to authenticated clients.

## Clan Settings

Phase 25 adds leader-controlled clan settings:

- Leaders can update public description, color, city, country code and join policy.
- Captains keep member-management powers but cannot alter clan identity.
- Join policy changes immediately affect discovery, public requests and invite-only behavior.
- `update-clan-settings` exposes the flow to authenticated clients.

## Clan Lifecycle

Phase 26 adds clan lifecycle controls:

- Members can leave their clan through a server-authoritative endpoint.
- Leaders must transfer leadership before leaving.
- Leadership transfer promotes the target member to leader and demotes the previous leader to captain.
- Lifecycle actions are written to `clan_governance_audit`.
- `clan-lifecycle` exposes leave and leadership transfer actions to authenticated clients.

## Clan Wars

Phase 27 adds clan war declarations:

- Leaders and captains can declare war against another clan.
- Active war pairs are unique regardless of declaration direction.
- Target clan members receive `clan_war` notifications.
- Leaders and captains from either side can end an active war.
- `clan-wars` exposes war reads, declarations and closures to authenticated clients.
