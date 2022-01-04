/**
 * Joplin plugin entry point.
 * Events and data are serialized and sent to the webview.
 *
 * Some problems with the current joplin API :
 * - Tags updates are not triggering note updates
 * - Note deletion are not triggering a note deleted event.
 * - some actions are not triggering events but do affect plugins :
 * for example, going to settings screen and back will not restore the plugin state.
 */

import joplin from "api";
import JoplinDataManager from "./joplin/joplin-data-manager";
import {
  PluginEvent,
  PluginMessage,
  WebviewEvent,
  WebViewMessage,
  WebviewNoteSelectedMessage,
} from "./common/message";
import Graph from "./core/graph";
import { LOCAL_GRAPH_ID } from "./core/definitions";
import { registerSettings, pluginSettings } from "./joplin/joplin-settings";
import { ToolbarButtonLocation } from "api/types";
import { SettingLabel } from "./core/settings";

const dataManager = JoplinDataManager.instance();

let pollResponse = null;
let webviewNotifications = [];

//we store a graph in the plugin process to manage repeated note updates.
const graphId = LOCAL_GRAPH_ID;
const graph = new Graph(graphId);

async function notifyWebview(msg: PluginMessage) {
  webviewNotifications.push(msg);
  sendPluginMessage();
}

//webview ready and plugin has messages to push
async function sendPluginMessage() {
  if (pollResponse && webviewNotifications.length > 0) {
    let notification = webviewNotifications.shift();
    pollResponse(notification);
    pollResponse = undefined;
  }
}

joplin.plugins.register({
  onStart: async function () {
    
    const panel = await joplin.views.panels.create("graph");
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

    await registerSettings();
    
    const shouldShow = await joplin.settings.value(SettingLabel.SHOW_ON_START);
    await joplin.views.panels.show(panel, shouldShow);
    
    await joplin.commands.register({
      name: 'showGraph',
      label: 'Show/Hide Graph',
      iconName: 'fas fa-project-diagram',
      execute: async () => {
        const shouldShow = ! await joplin.views.panels.visible(panel);
        notifyWebview({ event: PluginEvent.RESUME_ANIMATION, value: shouldShow });
        //asynchronously hiding the panel prevents the webview to pause the canvas animation so we need to synchronize
        notifyWebview({ event: PluginEvent.SHOW_PANEL, value: shouldShow });
      },
    });
    await joplin.views.toolbarButtons.create('showGraph', 'showGraph', ToolbarButtonLocation.NoteToolbar);

    joplin.views.panels.onMessage(panel, async (message: WebViewMessage) => {
      switch (message.event) {
        case WebviewEvent.ACCEPT_NEW_PLUGIN_EVENT: {
          // ui is ready for new updates
          let p = new Promise((resolve) => {
            pollResponse = resolve;
          });
          sendPluginMessage();
          return p;
        }
        case WebviewEvent.NOTE_SELECTED: {
          const msg = message as WebviewNoteSelectedMessage;
          if (msg.value?.openNoteId) {
            joplin.commands.execute("openNote", msg.value.openNoteId);
          }
          break;
        }
        case WebviewEvent.GET_DATA: {
          if(! await joplin.views.panels.visible(panel)) {
            //optimization. webview is reinitialized each time the panel visibility changes.
            return;
          }
          graph.nodes = await dataManager.getAllNodes();
          notifyWebview({ event: PluginEvent.FULL_UPDATE, value: graph.nodes });
          break;
        }
        case WebviewEvent.GET_SETTINGS: {
          if(! await joplin.views.panels.visible(panel)) {
            //optimization. webview is reinitialized each time the panel visibility changes.
            return;
          }
          //collect settings from joplin
          const values = await Promise.all(
            Object.keys(pluginSettings).map(key => {
              return joplin.settings.value(key);
            })
          );

          // we use settings' labels rather than keys to decouple ui from joplin
          const settings = Object.values(pluginSettings).map((value, index) => {
            return { key: value.label, value: values[index] };
          });

          notifyWebview({ event: PluginEvent.SETTING_UPDATED, value: settings });
          break;
        }
        case WebviewEvent.SHOW_PANEL: {
          await joplin.views.panels.show(panel, message.value);
        }
      }
    });

    //note selected in the editor
    joplin.workspace.onNoteSelectionChange(async (event: any) => {
      let noteIds = event.value;

      //TODO Change when Joplin API is fixed.
      //deletion are not notified via the api but trigger a note reselect when happening through editing
      //so we trigger a full refresh each time.
      //this is not great but a temporary workaround.
      graph.nodes = await dataManager.getAllNodes();
      notifyWebview({ event: PluginEvent.FULL_UPDATE, value: graph.nodes });

      notifyWebview({ event: PluginEvent.NOTE_SELECTED, value: noteIds });
    });

    joplin.workspace.onNoteChange(async (event: any) => {
      if (event.event == 1) {
        const node = await dataManager.getNode(event.id);
        graph.nodes.set(node.id, node);
        notifyWebview({
          event: PluginEvent.PARTIAL_UPDATE,
          value: { graphId: graphId, add: [node] },
        });
      } else if (event.event == 2) {
        // when editing a note, the plugin gets notified after each keystroke sequence,
        // and would trigger constant graph refresh.
        // we prevent that behavior if the metadata we track are not modified.
        const old = graph.nodes.get(event.id);
        const node = await dataManager.getNode(event.id);
        
        if (JSON.stringify(old) === JSON.stringify(node)) {
          return;
        }
        graph.nodes.set(node.id, node);
        notifyWebview({
          event: PluginEvent.PARTIAL_UPDATE,
          value: { graphId: graphId, update: [node] },
        });
      } else if (event.event == 3) {
        graph.nodes.delete(event.id);
        notifyWebview({
          event: PluginEvent.PARTIAL_UPDATE,
          value: { graphId: graphId, delete: [event.id] },
        });
        // This is never triggered by Joplin. Bug in joplin API?
      }
    });

    await joplin.settings.onChange(async (event: any) => {
      const values = await Promise.all(
        event.keys.map((key: string) => joplin.settings.value(key))
      );

      let keys = event.keys.map( (key : string) => pluginSettings[key].label);

      const settings = keys.map((key: string, index : number) => {
        return { key: key, value: values[index] };
      });
      notifyWebview({ event: PluginEvent.SETTING_UPDATED, value: settings });
    });
  },
});
