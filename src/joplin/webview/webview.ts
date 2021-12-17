/**
 * The webview manages the interactions between the ui and the joplin plugin system.
 * Messages are sent back and forth between the webview and the plugin.
 * The plugin also listen to ui events so it can notify joplin of user actions.
 * 
 */


import {PluginEvent, PluginMessage, UIEvent, WebviewEvent, WebViewMessage} from '../../common/message'
import {didPartialModelUpdate, didFullModelUpdate, didSelectNodes, didSettingsUpdate, on } from '../../ui/graph-ui'


declare var webviewApi : any;

// The webview is not only loaded on plugin startup, but also each time settings update.
// So data and settings must be requested each time the ui reloads. 
webviewApi.postMessage({event:WebviewEvent.GET_DATA});
webviewApi.postMessage({event:WebviewEvent.GET_SETTINGS});

poll();

function poll() {
    const message : WebViewMessage = {event: WebviewEvent.ACCEPT_NEW_PLUGIN_EVENT};
    webviewApi.postMessage(message).then(async (msg : PluginMessage) => {   
        switch( msg.event) {
            case PluginEvent.NOTE_SELECTED:
                didSelectNodes(msg.value);
                break;
            case PluginEvent.PARTIAL_UPDATE:
                didPartialModelUpdate(msg.value);
                break;
            case PluginEvent.FULL_UPDATE:
                didFullModelUpdate(msg.value);
                break;
            case PluginEvent.SETTING_UPDATED:
                didSettingsUpdate(msg.value);
                break;
        }
        poll();
    })
}


on(UIEvent.NOTE_SELECTED, (selection) => {
    webviewApi.postMessage({event:WebviewEvent.NOTE_SELECTED, value:selection});
});

on(UIEvent.REFRESH_DATA, () => {
    webviewApi.postMessage({event:WebviewEvent.GET_DATA});
});

on(UIEvent.REFRESH_SETTINGS, () => {
    webviewApi.postMessage({event:WebviewEvent.GET_SETTINGS});
});

