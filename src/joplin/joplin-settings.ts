import joplin from 'api';
import { SettingItemType } from 'api/types';
import { SettingLabel } from '../core/settings';

const sectionName = "graph"

export const pluginSettings = {
  COOLDOWN_TICKS: {
    value: 500,
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.COOLDOWN_TICKS,
    description: 'Simulation stops after COOLDOWN_TICKS or COOLDOWN_TIME (ms) has elapsed, whichever occurs first.'
  },
  COOLDOWN_TIME: {
    value: 4000,
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.COOLDOWN_TIME,
    description: 'Simulation stops after COOLDOWN_TICKS or COOLDOWN_TIME (ms) has elapsed, whichever occurs first.'
  },
  WARMUP_TICKS: {
    value: 0, 
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.WARMUP_TICKS,
    description: "Number of simulation steps before the graph render. For optimization.",
  },
  FONT_SIZE: {
    value: 2, 
    type: SettingItemType.Int,
    section: sectionName,
    public: true,
    label: SettingLabel.FONT_SIZE,
    description: "Size node label in px.",
  },
  RELATIVE_FONT_SIZE: {
    value: true, 
    type: SettingItemType.Bool,
    section: sectionName,
    public: true,
    label: SettingLabel.RELATIVE_FONT_SIZE,
    description: "Should the label size be proportional to node size?",
  },
}

export async function registerSettings() {
  
  await joplin.settings.registerSection(sectionName, {
    label: 'Graph',
    iconName: 'fas fa-project-diagram'
  });

  return await joplin.settings.registerSettings(pluginSettings);
}
