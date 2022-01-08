/**
 * Joplin plugin entry point.
 * Manages data and refresh UI.
 */

import joplin from "api";
import JoplinDataManager from "./joplin/joplin-data-manager";
import {
  PluginEvent,
  PluginMessage,
  WebviewEvent,
  WebViewMessage,
  NoteSelectedWebViewMessage,
} from "./common/message";
import Graph from "./core/graph";
import { LOCAL_GRAPH_ID } from "./core/definitions";
import {
  registerPluginSettings,
  PLUGIN_SETTINGS,
} from "./joplin/joplin-settings";
import { ToolbarButtonLocation } from "api/types";
import { Setting, SettingLabel } from "./core/settings";
import GraphUpdate from "./core/graph-update";
import Node, { NODE_TYPE } from "./core/node";
import Link, { LINK_TYPE } from "./core/link";
import {same} from "fast-array-diff";
import { Tag } from "./core/tag";

const dataManager = JoplinDataManager.instance();

let pollResponse = null;
let webviewNotifications = [];

let panel: string;
let active: boolean;
let activeUpdateId: NodeJS.Timeout;
let UPDATE_INTERVAL: number;
let UPDATE_TAGS: boolean = true;
let ASYNC_TAG_UPDATE = true;
let cursor: string = null;

const pluginSettings = new Map<SettingLabel, Setting>();
const graphId = LOCAL_GRAPH_ID;
const graph = new Graph(graphId);
let openedNoteId: string;

async function createPanel() {
  panel = await joplin.views.panels.create("graph");
  await joplin.views.panels.setHtml(
    panel,
    `
    <div class="container">
    <div class="Graph__panels">
      <div id="graph"></div>
      <div id="control"></div>
      <div id="menu"></div>
    </div>
  </div>
    `
  );
  joplin.views.panels.addScript(panel, "./joplin/webview/webview.js");
  joplin.views.panels.addScript(panel, "./index.css");

  await joplin.views.panels.show(panel, active);

  joplin.views.panels.onMessage(panel, async (message: WebViewMessage) => {
    switch (message.event) {
      case WebviewEvent.ACCEPT_NEW_PLUGIN_EVENT: { // ui is ready for new updates
        let p = new Promise((resolve) => {
          pollResponse = resolve;
        });
        sendPluginMessage();
        return p;
      }
      case WebviewEvent.UI_READY: {
        if (active) {

          //lazy load the data
          if(!cursor) {
            //For large graphs, we could send updates in successive batches to reduce time to first draw.
            graph.nodes = await dataManager.getAllNodes();
            await updateTags();
          }

          resumeUpdates();
          
          notifyWebview({ 
            event: PluginEvent.SETTINGS_UPDATE,
            value: Array.from(pluginSettings.values())
          });

          notifyWebview({
            event: PluginEvent.FULL_UPDATE,
            value: graph,
          });

        }
        else { // startup or user has exited settings page 
          pauseUpdates();
          notifyWebview({ event: PluginEvent.RESUME_ANIMATION, value: false });
        }
        break;
      }
      case WebviewEvent.NOTE_SELECTED: {
        const msg = message as NoteSelectedWebViewMessage;
        if (msg.value?.openNoteId) {
          joplin.commands.execute("openNote", msg.value.openNoteId);
        }
        break;
      }
    }
  });

  /* user has selected notes in the editor */
  joplin.workspace.onNoteSelectionChange(async (event: any) => {
    if (!active) {
      return;
    }
    let noteIds = event.value;

    if (noteIds.length == 1) {
      openedNoteId = noteIds[0];
    }
    notifyWebview({ event: PluginEvent.NOTE_SELECTED, value: noteIds });
  });

  /* user has changed plugin settings */
  await joplin.settings.onChange(async (event: any) => {
    await updateUserSettings(event.keys as SettingLabel[]);

    UPDATE_INTERVAL = pluginSettings.get(SettingLabel.UPDATE_INTERVAL).value as number;

    if(event.keys.includes(SettingLabel.UPDATE_INTERVAL)) {
      resumeUpdates();
    }
  });
}

/* Enqueue message to be sent */
async function notifyWebview(msg: PluginMessage) {
  webviewNotifications.push(msg);
  sendPluginMessage();
}

/* Process next message */
async function sendPluginMessage() {
  if (pollResponse && webviewNotifications.length > 0) {
    let notification = webviewNotifications.shift();
    pollResponse(notification);
    pollResponse = undefined;
  }
}

/* startup */
joplin.plugins.register({
  onStart: async function () {

    await registerPluginSettings();
    await updateUserSettings(Object.keys(PLUGIN_SETTINGS) as SettingLabel[]);

    active = pluginSettings.get(SettingLabel.SHOW_ON_START).value as boolean;
    UPDATE_INTERVAL = pluginSettings.get(SettingLabel.UPDATE_INTERVAL).value as number;

    // fix https://github.com/agerardin/joplin-plugin-knowledge-graph/issues/12
    createPanel();

    joplin.commands.register({
      name: "showGraph",
      label: "Show/Hide Graph",
      iconName: "fas fa-project-diagram",
      execute: async () => {
        togglePluginState();
      },
    });

    joplin.views.toolbarButtons.create(
      "showGraph",
      "showGraph",
      ToolbarButtonLocation.NoteToolbar
    );

    joplin.workspace.selectedNoteIds().then((noteIds) => {
      if (noteIds.length == 1) {
        openedNoteId = noteIds[0];
      }
    });
  },
});

/* show/hide the panel */
async function togglePluginState() {
  active = !active;
  await showPanel(active);
  notifyWebview({ event: PluginEvent.RESUME_ANIMATION, value: active });
}

/* stop fetching updates */
function pauseUpdates() {
  clearInterval(activeUpdateId);
  activeUpdateId = null;
}

/* schedule updates */
function resumeUpdates() {
  
  if (activeUpdateId) {
    clearInterval(activeUpdateId);
  }

  activeUpdateId = setInterval(async () => {

    const recoveryCursor = cursor;

    try {

    let { updates, cursor: updatedCursor } = await dataManager.getNoteUpdates(
      cursor
    );
    cursor = updatedCursor;

    let graphUpdate: GraphUpdate = new GraphUpdate(graphId);

    let node = null;

    for(const update of updates) {
      switch (update.type) {
        case 1: //add
          node = await dataManager.getNode(update.item_id);
          graphUpdate.add.push(node);
          graph.nodes.set(update.item_id, node);
          break;
        case 2: //update
          node = await dataManager.getNode(update.item_id);
          if(update.item_id == openedNoteId) {
              const old = graph.nodes.get(update.item_id);
              if (JSON.stringify(old) === JSON.stringify(node)) {
                break;
              }
          }
          graphUpdate.update.push(node);
          graph.nodes.set(update.item_id, node);
          break;
        case 3: //delete
          graphUpdate.delete.push(update.item_id);
          graph.nodes.delete(update.item_id);
          break;
      }
    };

    if(UPDATE_TAGS) {
      (ASYNC_TAG_UPDATE) ? asyncTagUpdates() : await syncTagUpdates(graphUpdate);
    }

    if(!graphUpdate.isEmpty()) {
      notifyWebview({
        event: PluginEvent.PARTIAL_UPDATE,
        value: graphUpdate,
      }); 
    }
  }
  catch(error) {
    console.error('data update failed.', error);
    cursor = recoveryCursor;
  }

  }, UPDATE_INTERVAL);
}

/* merging tags and notes updates  */
async function syncTagUpdates(graphUpdate : GraphUpdate) {

  const graphUpdateTags = await updateTags();

  graphUpdate.add.push(...graphUpdateTags.add);
  graphUpdate.update.push(...graphUpdateTags.update);
  graphUpdate.delete.push(...graphUpdateTags.delete);

  graphUpdate.tagIndex = graphUpdateTags.tagIndex;
}

/* sending tag updates asynchronously  */
async function asyncTagUpdates() {
  updateTags().then((graphUpdate : GraphUpdate) => {
    if(!graphUpdate.isEmpty()) {
      notifyWebview({
        event: PluginEvent.PARTIAL_UPDATE,
        value: graphUpdate,
      }); 
    }
  });
}

async function showPanel(show: boolean) {
  await joplin.views.panels.show(panel, show);
}

async function updateUserSettings(settings: SettingLabel[]) {
  
  const values = await Promise.all(
    settings.map((key) => {
      return joplin.settings.value(key);
    })
  );

  const updatedSettings = settings.map((key, index) => {
    const setting = new Setting(key, values[index]);
    pluginSettings.set(key, setting);
    return setting;
  });

  notifyWebview({ event: PluginEvent.SETTINGS_UPDATE, value: updatedSettings});
}

/* Fetch tag updates from joplin.
 * Scale linearly with the amount of tagged notes.
 * Temporary workaround until joplin `events` endpoint supports tags.
 */
async function updateTags() : Promise<GraphUpdate> {

  let tags = await dataManager.getTags();

  let updatedTagIndex = new Map<string, Tag>();
  const results = await Promise.all(Array.from(tags).map( tag => dataManager.getNodeIdsForTag(tag)));
  results.forEach( (nodeIds, index) => 
    updatedTagIndex.set(tags[index].label, {... tags[index], nodeIds: nodeIds})
  );
  
  const graphUpdate = new GraphUpdate(graphId);

  graph.tagIndex.forEach( (value, key) => {
    if(!updatedTagIndex.has(key)) { //delete
      graph.nodes.delete(key);
      graph.tagIndex.delete(key);
      graphUpdate.delete.push(value.id);
    }
  });

  updatedTagIndex.forEach( (tag, key) => {
    if(graph.tagIndex.has(key)) { //update
      const node = graph.nodes.get(tag.id);
      let diff = same(graph.tagIndex.get(key).nodeIds, tag.nodeIds);
      if(diff.length !== tag.nodeIds.length) {
        node.rel = tag.nodeIds.map(nodeId => {
          const link = new Link(tag.id, nodeId, "TAG");
          return link;
        });
        graph.nodes.set(tag.id, node);
        graph.tagIndex.set(key, tag);
        graphUpdate.update.push(node);
      }
    }
    else { //add
      let node = new Node(tag.id);
      node.label = tag.label;
      node.type = NODE_TYPE.TAG;
      node.tags = new Set([tag.label]);
      
      node.rel = tag.nodeIds.map(nodeId => new Link(tag.id, nodeId, "TAG"));

      graph.nodes.set(tag.id, node);
      graph.tagIndex.set(key, tag);
      graphUpdate.add.push(node);
    }
  });

  if(!graphUpdate.isEmpty()) {
    graphUpdate.tagIndex = updatedTagIndex;
  }

  return graphUpdate;
}

