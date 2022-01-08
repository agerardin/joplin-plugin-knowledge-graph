import { ID } from "src/core/definitions";
import GraphNode from  "./graph-node"
import Link from "src/core/link";
import { Tag } from "src/core/tag";
import { ForceGraphInstance } from "force-graph";


// values for all forces
const defaultForceProperties = {
  center: {
      enabled: false,
      x: 0,
      y: 0
  },
  charge: {
      enabled: false,
      strength: -30,
      distanceMin: 1,
      distanceMax: {
        value: Math.exp(Math.log(2000)),
        lowerBound: 1,
        upperBound: Math.exp(Math.log(2000)),
        step: 0.1,
        scale:"log"
      },
      step: 1
  },
  collide: {
      enabled: true,
      strength: .7,
      iterations: 1,
      radius: 30
  },
  forceX: {
      enabled: false,
      strength: .05,
      x: 0
  },
  forceY: {
      enabled: false,
      strength: .05,
      y: 0
  },
  link: {
      enabled: true,
      distance: 30,
      iterations: 1
  }
}

// graph styling
// default style is using a dark color theme
const defaultStyle = {
  background: "#202020",
  link: {
    color: "#277da1",
    // color: "#fff",
    highlightedColor: "#0096FF",
    width: 1.5,
    particleWidth: 3.0,
  },
  fontSize: "#CECECE",
  node: {
    color: "grey",
    highlightedColor: "#CECECE",
    selectedColor: "#45b1ff",
    border: {
      color: "#CECECE",
      highlightedColor: "#0096FF",
      selectedColor: "#45b1ff",
    },
  },
  tagNode: {
    highlightColor: "orange",
    selectedColor: 'darkorange'
  }
};

export enum FilterKey {
  TAG_NODE= "TAG_NODE",
  TAG_SELECTION = "TAG_SELECTION",
  ONLY_SELECTED_NODE = "ONLY_SELECTED_NODE"
}

export type FilterFn = (elt: any) => boolean;

export interface Filter {
  name: FilterKey,
  filter: FilterFn
}


export class Model {
  nodes = new Map<ID, GraphNode>();
  tagIndex = new Map<string, Tag>();
  suggestions = [];
  showAllLinks: boolean = true;
  showTagNodes: boolean = true;
  nodeFilters: Filter[] = [];
  linkFilters: Filter[] = [];
  style = Object.assign({}, defaultStyle);
  forceProperties = JSON.parse(JSON.stringify(defaultForceProperties))
  width = 0;
  height = 0;
  focusedNodes = new Set<GraphNode>();
  graph : ForceGraphInstance;

  focusedLinks = new Set<Link>();
  hoveredNode: GraphNode;
  selectedNodes = new Set<GraphNode>();
  selectedLinks = new Set<Link>();

  constructor(graph?: ForceGraphInstance) {
    this.graph = graph;
  }

  resetForces() {
    this.forceProperties = JSON.parse(JSON.stringify(defaultForceProperties));
  }


  clearFilters() {
    this.nodeFilters = [];
    this.linkFilters = [];
  }

  hoverNode(node: GraphNode) {
    this.hoveredNode = node;
    this.updateFocus();
  }

  selectNode(node: GraphNode) {
    this.selectedNodes.add(node);
    // this.updateFocus();
  }

  selectLink(link: Link) {
    this.selectedLinks.add(link);
    this.updateFocus();
  }

  unselectNode(node: GraphNode) {
    this.selectedNodes.delete(node);
    // this.updateFocus();
  }

  unselectLink(link: Link) {
    this.selectedLinks.delete(link);
    this.updateFocus();
  }

  clearSelection() {
    this.selectedLinks.clear();
    this.selectedNodes.clear();
    this.updateFocus();
  }

  private updateFocus() {
    const focusedNodes = new Set<GraphNode>(this.selectedNodes);
    const focusedLinks = new Set<Link>(this.selectedLinks);
    
    if(this.hoveredNode) focusedNodes.add(this.hoveredNode);

    const nodes = Array.from(focusedNodes);

    nodes.forEach(node => {
      node.backlinks.forEach( (link : Link) => {
        focusedLinks.add(link);
        focusedNodes.add(this.nodes.get(link.sourceId));
      });
      node.links.forEach((link : Link) => {
        focusedLinks.add(link);
        focusedNodes.add(this.nodes.get(link.targetId));
      });
    })

    Array.from(this.selectedLinks).forEach(link => {
      focusedLinks.add(link);
      focusedNodes.add(this.nodes.get(link.sourceId));
      focusedNodes.add(this.nodes.get(link.targetId));
  });

    this.focusedNodes = focusedNodes;
    this.focusedLinks = focusedLinks;
  }

}
