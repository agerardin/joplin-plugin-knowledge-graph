export enum SettingLabel {
  COOLDOWN_TICKS = 'COOLDOWN_TICKS',
  COOLDOWN_TIME = 'COOLDOWN_TIME',
  WARMUP_TICKS = 'WARMUP_TICKS',
  FONT_SIZE = 'FONT_SIZE',
  RELATIVE_FONT_SIZE = 'RELATIVE_FONT_SIZE',
  SHOW_ON_START = 'SHOW_ON_START',
  SHOW_MENU_ON_START = 'SHOW_MENU_ON_START',
  MENU_PANEL_SIZE = 'MENU_PANEL_SIZE',
  UPDATE_INTERVAL = 'UPDATE_INTERVAL',
  PAINT_PHOTONS_ON_CLICK = 'PAINT_PHOTONS_ON_CLICK',
  PAINT_PHOTONS_ON_HOVER = 'PAINT_PHOTONS_ON_HOVER'
}

type SettingValue = string | number | boolean;

export class Setting {
  key: SettingLabel
  value: SettingValue

  constructor(key: SettingLabel, value: SettingValue) {
    this.key = key;
    this.value = value;
  }
}

