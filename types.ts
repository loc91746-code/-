export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  WON = 'WON',
  LOST = 'LOST'
}

export interface MonitorState {
  id: number;
  isOn: boolean;
  characterSeed?: string;
}

export interface GameStats {
  score: number; // Represents Watts saved
  screensActive: number;
}