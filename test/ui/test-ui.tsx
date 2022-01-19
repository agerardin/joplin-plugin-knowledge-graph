import Graph from "src/core/graph";
import { generateRandomGraph, createNode, createLink, selectRandomElementFromArray, selectRandomElementFromGraph, generateGraph, generateNodes } from "../tools/graph-generator";
import {didFullModelUpdate, didPartialModelUpdate, didSettingsUpdate} from '../../src/ui/graph-ui'
import { SettingLabel } from "../../src/core/settings";

import './test-ui.css'
import { uid } from "uid";
import Note, { buildNodeFromNote } from "../../src/joplin/note";


// import generateGraph from './generate-graph'
window.addEventListener('load', async function () {
    let graph = generateRandomGraph(400, 200, 50, 20, 'test-graph');

    // let nodes = generateNodes(5);
    // createLink(nodes[0], nodes[1]);
    // createLink(nodes[1], nodes[2]);
    // createLink(nodes[1], nodes[2]);
    // createLink(nodes[2], nodes[1]);
    // createLink(nodes[2], nodes[1]);
    // createLink(nodes[2], nodes[1]);
    // createLink(nodes[1], nodes[3]);
    // createLink(nodes[2], nodes[4]);
    // createLink(nodes[3], nodes[4]);

    // nodes[1].tags.add('math');
    // nodes[2].tags.add('math').add('education');
    // nodes[3].tags.add('education');

    // let graph = generateGraph(nodes, 'simple_diamond_graph');

    // const parentId = uid();
    // const joplinNote1: Note = {id:'1', title:'note1', parentId: parentId, links: [] };
    // const joplinNote2 = {id:'2', title:'note2', parentId: parentId, links: [] };
    // joplinNote1.links.push({noteId: '2', elementId: 'section1'});
    // const joplinNotes = [joplinNote1, joplinNote2];
    // const nodes = joplinNotes.map(joplinNote => buildNodeFromNote(joplinNote));
    // const graph = generateGraph(nodes, 'test');  

    let count = 0;

    let btn = document.getElementById('addNodes');
    btn.addEventListener('click', () => {
        let newNode = createNode(graph.nodes.size.toString());
        let node = selectRandomElementFromGraph(graph);
        node.tags.add('tag' + count.toString());
        createLink(newNode, node);
        count++
        graph.addNode(newNode);
        didFullModelUpdate(graph);
    });

    // const nodes = new Map(graph.nodes);
    // btn.addEventListener('click', () => {
    //     let newNode = createNode(nodes.size);
    //     let node = selectRandomElementFromArray(Array.from(nodes.values()));
    //     nodes.set(newNode.id, newNode);
    //     createLink(newNode, node);
    //     didPartialModelUpdate({graphId:graph.id, add:[newNode]});
    // });


    didSettingsUpdate([{key: SettingLabel.COOLDOWN_TIME, value: 2000}]);

    didFullModelUpdate(graph);

});