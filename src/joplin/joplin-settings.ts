import joplin from 'api';
import { SettingItemType } from 'api/types';
import { SettingLabel } from '../core/settings';

const sectionName = "graph"

export const PLUGIN_SETTINGS = {
  [SettingLabel.COOLDOWN_TICKS]: {
    value: 200,
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.COOLDOWN_TICKS,
    description: 'Simulation stops after COOLDOWN_TICKS or COOLDOWN_TIME (ms) has elapsed, whichever occurs first. - DEFAULT: 200'
  },
  [SettingLabel.COOLDOWN_TIME]: {
    value: 4000,
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.COOLDOWN_TIME,
    description: 'Simulation stops after COOLDOWN_TICKS or COOLDOWN_TIME (ms) has elapsed, whichever occurs first. - DEFAULT: 3600'
  },
  [SettingLabel.WARMUP_TICKS]: {
    value: 0, 
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.WARMUP_TICKS,
    description: "Number of simulation steps before the graph render. For optimization. - DEFAULT: 0",
  },
  [SettingLabel.FONT_SIZE]: {
    value: 4, 
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.FONT_SIZE,
    description: "Size node label in px. - DEFAULT: 4",
  },
  [SettingLabel.RELATIVE_FONT_SIZE]: {
    value: true, 
    type: SettingItemType.Bool,
    section: sectionName,
    public: true,
    label: SettingLabel.RELATIVE_FONT_SIZE,
    description: "Should the label size be proportional to node weight?",
  },
  [SettingLabel.SHOW_ON_START]: {
    value: true, 
    type: SettingItemType.Bool,
    section: sectionName,
    public: true,
    label: SettingLabel.SHOW_ON_START,
    description: "Should the graph be displayed on startup?",
  },
  [SettingLabel.SHOW_MENU_ON_START]: {
    value: true, 
    type: SettingItemType.Bool,
    section: sectionName,
    public: true,
    label: SettingLabel.SHOW_MENU_ON_START,
    description: "Should the controls menu be displayed on startup?",
  },
  [SettingLabel.MENU_PANEL_SIZE]: {
    value: 15, 
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.MENU_PANEL_SIZE,
    description: "Portion of the graph panel the menu panel should extend to (in %) - DEFAULT: 15",
  },
  [SettingLabel.UPDATE_INTERVAL]: {
    value: 1000, 
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.UPDATE_INTERVAL,
    description: "Time interval (in ms) between updates requests to joplin. - DEFAULT: 1000",
  },
  [SettingLabel.PAINT_PHOTONS_ON_CLICK]: {
    value: true, 
    type: SettingItemType.Bool,
    section: sectionName,
    public: true,
    label: SettingLabel.PAINT_PHOTONS_ON_CLICK,
    description: "Should link directional particle be painted on node click? Set to false to reduce CPU usage.",
  },
  [SettingLabel.PAINT_PHOTONS_ON_HOVER]: {
    value: false, 
    type: SettingItemType.Bool,
    section: sectionName,
    public: true,
    label: SettingLabel.PAINT_PHOTONS_ON_HOVER,
    description: "Should link directional particle be painted on node hover? Set to false to reduce CPU usage.",
  },
}

export async function registerPluginSettings() {
  
  await joplin.settings.registerSection(sectionName, {
    label: 'Graph',
    iconName: 'fas fa-project-diagram'
  });

  return await joplin.settings.registerSettings(PLUGIN_SETTINGS);
}
