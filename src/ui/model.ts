import ModelNode from "src/core/node";
import { ID } from "src/core/definitions";
import GraphNode from  "./graph-node"
import Link from "src/core/link";


// values for all forces
const forceProperties = {
  center: {
      enabled: true,
      x: 0,
      y: 0
  },
  charge: {
      enabled: true,
      strength: -30,
      distanceMin: 1,
      distanceMax: 10000,
      distanceMaxLowerBound: 0,
      distanceMaxUpperBound: 40000,
      step:1000
  },
  collide: {
      enabled: true,
      strength: .7,
      iterations: 1,
      radius: 5
  },
  forceX: {
      enabled: false,
      strength: .1,
      x: .5
  },
  forceY: {
      enabled: false,
      strength: .1,
      y: .5
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
  node: {
    fontColor: "#CECECE",
    color: "#CECECE",
    highlightedColor: "#CECECE",
    border: {
      color: "#CECECE",
      highlightedColor: "#0096FF",
    },
  },
  tagNode: {
    highlightColor: "orange",
  }
};

export interface TagIndex {
  tagNodeId: ID,
  count: number
}

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
  tags = new Map<string, TagIndex>();
  suggestions = [];
  showAllLinks: boolean = true;
  showTagNodes: boolean = true;
  nodeFilters: Filter[] = [];
  linkFilters: Filter[] = [];
  style = defaultStyle;
  forceProperties = forceProperties;
  width = 0;
  height = 0;

  focusedNodes = new Set<GraphNode>();

  focusedLinks = new Set<Link>();
  hoveredNode: GraphNode;
  selectedNodes = new Set<GraphNode>();
  selectedLinks = new Set<Link>();

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
    this.updateFocus();
  }

  selectLink(link: Link) {
    this.selectedLinks.add(link);
    this.updateFocus();
  }

  unselectNode(node: GraphNode) {
    this.selectedNodes.delete(node);
    this.updateFocus();
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
