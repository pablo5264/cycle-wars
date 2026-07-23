import type { BattleParticipant, BattleSummary } from "../../domain/models/AppModels";

export interface BattleView {
  id: string;
  status: string;
  territoryH3Index: string;
  participantCount: number;
  leader: BattleParticipant | null;
  participants: BattleParticipant[];
  intensity: number;
}

export class BattlePresenter {
  fromBattle(battle: BattleSummary | null): BattleView | null {
    if (!battle) {
      return null;
    }

    const participants = [...(battle.participants ?? [])].sort((a, b) => b.score - a.score);
    const leader = participants[0] ?? null;
    const totalScore = participants.reduce((sum, participant) => sum + participant.score, 0);
    const intensity = Math.min(1, totalScore / 5000);

    return {
      id: battle.id,
      status: battle.status,
      territoryH3Index: battle.territoryH3Index ?? battle.territory_h3_index ?? "unknown",
      participantCount: battle.participantCount ?? battle.participant_count ?? participants.length,
      leader,
      participants,
      intensity
    };
  }
}
