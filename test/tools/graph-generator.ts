import Node, { NODE_TYPE } from '../../src/core/node'
import Link from '../../src/core/link'
import Graph from '../../src/core/graph';

let debugNodeId = (index: number) => {
    return index.toString();
};

let nodeIdGenerator = debugNodeId;

export function createNode(id: string) {
    return new Node(id);
}

export function createLink(source: Node, target: Node) {
    const link = new Link(source.id, target.id);
    source.rel.push(link);
    return link;
}

export function generateNodes(N: number) : Array<Node> {
    const ids = [...Array(N).keys()].map((i) => nodeIdGenerator(i));
    const nodes = [...Array(N).keys()].map( i => {
        const node = new Node(ids[i]);
        node.label = 'node '+ ids[i].toString();
        return node;
    });
    return nodes;
}


export function generateRandomLinks(nodes: Node[], N: number) {
    const links = [...Array(N).keys()].map( _ => {
        let source : Node = selectRandomElementFromArray(nodes);
        let target: Node = selectRandomElementFromArray(nodes);
        const link = new Link(source.id, target.id);
        link.type = "REFERENCE";
        source.rel.push(link);
        return link;
    });
    return links;
}

/**
 * Note: Since tags are implemented as a set, it is possible that the same tag is applied 
 * several times to the same node, so that the total number of nodes having this tag
 * may be lower that M.
 * @param nodes list of nodes to add tags to
 * @param N number of individual tags to create
 * @param M maximum number of nodes that should be tagged with each tag.
 * @returns the list of tagged nodes.
 */
export function generateRandomTags(nodes: Node[], N: number, M: number) {
    
    const tagNodes = [...Array(N).keys()].map( index => {
        const tagNode = createNode(`tag${index}`);
        tagNode.type = NODE_TYPE.TAG;
        tagNode.label = `${tagNode.id}`;
        
        [...Array(M).keys()].forEach( _ => {
            let node = selectRandomElementFromArray(nodes);
            node.tags.add(`tag${index}`);
            const link = new Link(tagNode.id, node.id);
            link.type = "TAG";
            tagNode.rel.push(link);
        });
        return tagNode;
    });

    nodes.push(...tagNodes);
    return nodes;
}

export function generateGraph(nodes: Node[], id: string) {
    let graph = new Graph(id);
    nodes.forEach( node => graph.addNode(node));
    return graph;
}

export function generateRandomGraph(numberNodes: number, numberLinks: number, numberTags: number = 0, numberNodePerTags: number, id: string) {
    const nodes = generateNodes(numberNodes);
    generateRandomLinks(nodes, numberLinks);
    generateRandomTags(nodes, numberTags, numberNodePerTags);
    return generateGraph(nodes, id);
}


export function selectRandomElementFromArray(array: any[]) {
    const maxIndex = array.length - 1;
    return array[Math.round(Math.random() * maxIndex)];
}

export function selectRandomElementFromGraph(graph: Graph) {
    return selectRandomElementFromArray(Array.from(graph.nodes.values()));
}

export function generateSimpleDiamondGraph() {
    let nodes = generateNodes(5);
    createLink(nodes[0], nodes[1]);
    createLink(nodes[1], nodes[2]);
    createLink(nodes[1], nodes[3]);
    createLink(nodes[2], nodes[4]);
    createLink(nodes[3], nodes[4]);
    let graph = generateGraph(nodes, 'simple_diamond_graph');
    return graph;
}