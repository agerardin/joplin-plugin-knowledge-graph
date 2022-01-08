/**
 * The webview manages the interactions between the ui and the joplin plugin system.
 * Messages are sent back and forth between the webview and the plugin.
 * The plugin also listen to ui events so it can notify joplin of user actions.
 * 
 * The webview script is run not only on startup, but also each time the settings
 * are updated or that the panel is hidden.
 */
import {PluginEvent, PluginMessage, UIEvent, WebviewEvent, WebViewMessage, NoteSelectedWebViewMessage} from '../../common/message'
import {didPartialModelUpdate, didFullModelUpdate, didSelectNodes, didSettingsUpdate, on, resumeAnimation } from '../../ui/graph-ui'


declare var webviewApi : any;

const initCompleted = () => {
        webviewApi.postMessage({event:WebviewEvent.UI_READY});
}

function poll() {
    const message : WebViewMessage = {event: WebviewEvent.ACCEPT_NEW_PLUGIN_EVENT};
    webviewApi.postMessage(message).then(async (pluginMessage : PluginMessage) => {

        switch( pluginMessage.event) {
            case PluginEvent.NOTE_SELECTED:
                didSelectNodes(pluginMessage.value);
                break;
            case PluginEvent.PARTIAL_UPDATE:
                didPartialModelUpdate(pluginMessage.value);
                break;
            case PluginEvent.FULL_UPDATE:
                didFullModelUpdate(pluginMessage.value);
                break;
            case PluginEvent.SETTINGS_UPDATE:
                didSettingsUpdate(pluginMessage.value);
                break;
            case PluginEvent.RESUME_ANIMATION:
                resumeAnimation(pluginMessage.value);
                break;
        }
        poll();
    })
}


poll();

on(UIEvent.NOTE_SELECTED, (selection : NoteSelectedWebViewMessage ) => {
    webviewApi.postMessage({event:WebviewEvent.NOTE_SELECTED, value:selection});
});

initCompleted();