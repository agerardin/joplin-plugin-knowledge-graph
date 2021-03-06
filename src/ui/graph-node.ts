import Link from "../../src/core/link";
import Node from '../../src/core/node'

export default class GraphNode extends Node {
    links: Link[] = []; // subset of links used in the graph
    backlinks: Link[] = []; // reverse links
    x?: number; // x position - set by forceGraph
    y?: number; // y position - set by forceGraph
    vx?: number; 
    vy?: number;
    constructor(node: Node) {
        super(node.id);
        super.label = node.label;
        super.type = node.type;
        super.tags = node.tags;
        super.rel = node.rel;
        super.graphId = node.graphId;
    }
}