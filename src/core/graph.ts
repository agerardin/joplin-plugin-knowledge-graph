import {ID} from './definitions'
import Node from './node'
import { Tag } from './tag';

export default class Graph {
    nodes: Map<ID, Node> = new Map();
    tagIndex: Map<string, Tag> = new Map();
    id: ID

    constructor(id : ID) { 
        this.id = id;
    }

    addNode(node: Node) {
        this.nodes.set(node.id, node);
        node.graphId = this.id;
    }
}