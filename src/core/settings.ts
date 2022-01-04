export enum SettingLabel {
  COOLDOWN_TICKS = 'COOLDOWN_TICKS',
  COOLDOWN_TIME = 'COOLDOWN_TIME',
  WARMUP_TICKS = 'WARMUP_TICKS',
  FONT_SIZE = 'FONT_SIZE',
  RELATIVE_FONT_SIZE = 'RELATIVE_FONT_SIZE',
  SHOW_ON_START = 'SHOW_ON_START'
}

export interface Setting {
  key: SettingLabel
  value: number | string | boolean
}