export type PlayerRole =
  | "Duelist"
  | "Initiator"
  | "Controller"
  | "Sentinel"
  | "Flex";

export type EconomyState = "Full" | "Force" | "Eco";

export interface PlayerStats {
  aim: number; // 1-100: Kapabilitas raw fragging
  utility: number; // 1-100: Efisiensi penggunaan utilitas/skill
  morale: number; // 1-100: Berpengaruh pada performa saat tertinggal skor
  discipline: number; // 1-100: Mempengaruhi probabilitas terkena 'Random Event' negatif
}

export interface Contract {
  salary: number; // Gaji per periode/minggu
  buyout: number; // Nilai terminasi untuk dibeli tim lain
  isLoaned: boolean; // Status pinjaman
  duration: number; // Sisa durasi kontrak
}

export interface Player {
  id: string;
  name: string;
  alias: string; // In-game name (IGN)
  role: PlayerRole;
  stats: PlayerStats;
  contract: Contract;
  isSuspended?: boolean;
  suspensionMatches?: number;
  isTransferListed?: boolean;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  roster: Player[]; // Maksimal/Minimal 5 pemain inti
  bench: Player[]; // Pemain cadangan
  winRate?: number; // Rasio win-rate tim
}

export interface MatchState {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  currentRound: number;
  economyA: EconomyState;
  economyB: EconomyState;
  matchLog: string[]; // Log teks naratif dari simulasi ronde
  isFinished?: boolean;
  winner?: Team;
}

export interface GameEvent {
  id: string;
  type: "SCANDAL" | "VOLUNTARY_TRANSFER" | "GENERAL";
  title: string;
  description: string;
  affectedPlayerId?: string;
  affectedTeamId?: string;
  timestamp: Date | string;
}

export interface RoundSimulationResult {
  roundWinner: "teamA" | "teamB";
  scoreA: number;
  scoreB: number;
  currentRound: number;
  logs: string[];
  isMatchOver: boolean;
  matchWinner?: "teamA" | "teamB";
}

export interface MarketActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface BuyoutResult {
  buyerTeam: Team;
  sellerTeam?: Team;
  player: Player;
  feePaid: number;
}

export interface LoanResult {
  borrowerTeam: Team;
  lendingTeam?: Team;
  player: Player;
  feePaid: number;
  duration: number;
}

export interface TerminationResult {
  team: Team;
  terminatedPlayer: Player;
  penaltyPaid: number;
  moralePenaltyApplied: number;
}

export interface RosterActionResult {
  team: Team;
  message: string;
}
