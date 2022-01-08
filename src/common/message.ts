import { ID } from "src/core/definitions";
import { Setting, SettingLabel } from "src/core/settings";

export enum UIEvent {
  NOTE_SELECTED = "NOTE_SELECTED",
}

export enum WebviewEvent {
  ACCEPT_NEW_PLUGIN_EVENT = "ACCEPT_NEW_PLUGIN_EVENT",
  UI_READY = "STARTED",
  NOTE_SELECTED = "NOTE_SELECTED",
}

export enum PluginEvent {
  NOTE_SELECTED = "NOTE_SELECTED",
  FULL_UPDATE = "FULL_UPDATE",
  PARTIAL_UPDATE = "PARTIAL_UPDATE",
  SETTINGS_UPDATE = "SETTING_UPDATED",
  RESUME_ANIMATION = "RESUME_ANIMATION",
}

export interface WebViewMessage {
  event: WebviewEvent;
  value?: any;
}

export interface NoteSelectedWebViewMessage extends WebViewMessage {
  noteIds: ID[],
  current: ID[],
  openNote: boolean
}

export interface PluginMessage {
  event: PluginEvent;
  value?: any;
}


export interface SettingsUpdatePluginMessage extends PluginMessage {
  value: Setting[]
}