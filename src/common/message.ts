export enum UIEvent {
  NOTE_SELECTED = "NOTE_SELECTED",
  GET_DATA = "GET_DATA",
  GET_SETTINGS = 'GET_SETTINGS'
}

export enum WebviewEvent {
  ACCEPT_NEW_PLUGIN_EVENT = "ACCEPT_NEW_PLUGIN_EVENT",
  NOTE_SELECTED = "NOTE_SELECTED",
  GET_DATA = "GET_DATA",
  GET_SETTINGS = 'GET_SETTINGS'
}

export enum PluginEvent {
  NOTE_SELECTED = "NOTE_SELECTED",
  FULL_UPDATE = "FULL_UPDATE",
  PARTIAL_UPDATE = 'PARTIAL_UPDATE',
  SETTING_UPDATED = 'SETTING_UPDATED'
}

export interface WebViewMessage {
  event: WebviewEvent;
  value?: any;
}

export interface WebviewNoteSelectedMessage extends WebViewMessage {
  noteIds: string[],
  current: string[],
  openNote: boolean
}

export interface PluginMessage {
  event: PluginEvent;
  value?: any;
}