import ForceGraph, {
  NodeObject,
  GraphData,
  ForceGraphInstance,
} from "force-graph";
import React from "react";
import { render } from "react-dom";
import * as d3 from "d3";

import { ID } from "../core/definitions";
import Link from "../core/link";
import Node from "../core/node";
import GraphUpdate from "../core/graph-update";
import { Filter,  FilterKey, Model, TagIndex} from "./model";
import { UIEvent } from "../common/message";
import { ControlPanel, onEngineTick, onEngineStop } from "./control-panels/control-panel";
import GraphNode from "./graph-node";
import { Setting, SettingLabel } from "../core/settings";

const  model = new Model();
const elem = document.getElementById("graph");
const graph = ForceGraph()(elem);

let simulationTicksCounter = 0;

let FONT_SIZE = 3; 
let RELATIVE_NODE_SIZE = true;
let graphListeners: Map<UIEvent, Function> = new Map();
setupForceGraph();

window.addEventListener(
  "resize",
  function (_) {
    setGraphDimensions();
  },
  true
);

/**
 * Register listeners for events.
 * @param {*} event Event to listen to
 * @param {*} callback triggered when a event is emitted
 */
export function on(event: UIEvent, callback: Function) {
  graphListeners.set(event, callback);
}

export function didSelectNodes(nodeIds: ID[]) {
  const validNodes = nodeIds.map((noteId) => model.nodes.get(noteId)).filter(node => node);

  let centroid = {x:0, y:0};

  if(validNodes.length > 0) {
    centroid = validNodes.reduce((a : any, b:any) =>
      (b.x && b.y) ? {x: a.x + b.x, y: a.y + b.y} : a,
      {x:0, y:0}
    );
    centroid = {x:centroid.x / nodeIds.length, y:centroid.y / nodeIds.length};
  }

  graph.centerAt(centroid.x,centroid.y, 300).zoom(5, 300);
  model.clearSelection();

  validNodes.forEach((node) => model.selectNode(node));
}

/** Apply explicit diff updates on nodes */
export function didPartialModelUpdate(update: GraphUpdate) {

  const nodeIds = [];
  
  update.delete?.forEach((del) => model.nodes.delete(del));
  update.add?.forEach((add) => { 
    model.nodes.set(add.id, new GraphNode(add));
    nodeIds.push(add.id) 
  });
  update.update?.forEach((update) => {
    const node = model.nodes.get(update.id);
    Object.assign(node, update);
    nodeIds.push(update.id);
  });

  rebuildTagsIndex();
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
  didSelectNodes(nodeIds);
}

/** Apply implicit diff between the old model and the new one for smooth transition */
export function didFullModelUpdate(nodes: Map<ID, Node>) {
  model.nodes.forEach((del) => {
    if (!nodes.has(del.id)) {
      model.nodes.delete(del.id);
    }
  });
  nodes.forEach((update) => {
    if (!model.nodes.has(update.id)) {
      model.nodes.set(update.id, new GraphNode(update));
    } else {
      const oldNode = model.nodes.get(update.id);
      Object.assign(oldNode, update);
    }
  });

  rebuildTagsIndex();
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
}

export function didSettingsUpdate(settings : Setting[]) {
  settings.forEach( (setting : any) => {
    applySetting(setting);
  }
  )
}


function showAllLinks(show: boolean) {
  model.showAllLinks = show;
  if (!model.showAllLinks) {
    graph.linkCurvature(0);
  } else {
    graph.linkCurvature("curvature");
  }
}

function showTagNodes(show: boolean) {
  model.showTagNodes = show;
  model.nodeFilters = model.nodeFilters.filter((filter : Filter) => filter.name !== FilterKey.TAG_NODE);
  if (!model.showTagNodes) {
    model.nodeFilters.push( {name: FilterKey.TAG_NODE, filter: (node: GraphNode) => node.type != "tag"} );
  }
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
}

function showOnlySelectedNodes(showOnlySelected: boolean) {

  model.nodeFilters = model.nodeFilters.filter((filter : Filter) => filter.name !== FilterKey.ONLY_SELECTED_NODE);
  if (showOnlySelected) {
    model.nodeFilters.push( {name: FilterKey.ONLY_SELECTED_NODE, filter: (node: GraphNode) => model.focusedNodes.has(node)} );
  }
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
}

function tagSelectionChanged(tags: any[]) {
  model.nodeFilters = model.nodeFilters.filter((filter : Filter) => filter.name !== FilterKey.TAG_SELECTION);
  if(tags.length > 0) {
    model.nodeFilters.push( {name: FilterKey.TAG_SELECTION, filter: (node: GraphNode) => {
      const found = tags.findIndex(tag => (node.type == 'tag' && node.id == tag.id) || node.tags.has(tag.id)) != -1
      return found;
    }
   });
  }
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
}

function updateForces() {
  graph.d3Force("center")
      .x(model.width * model.forceProperties.center.x * (model.forceProperties.center.enabled === true ? 1 : 0))
      .y(model.height * model.forceProperties.center.y * (model.forceProperties.center.enabled === true ? 1 : 0));
      graph.d3Force("charge")
      .strength(model.forceProperties.charge.strength * (model.forceProperties.charge.enabled === true ? 1 : 0) )
      .distanceMin(model.forceProperties.charge.distanceMin)
      .distanceMax(model.forceProperties.charge.distanceMax);
      graph.d3Force("collide")
      .strength(model.forceProperties.collide.strength * (model.forceProperties.collide.enabled === true ? 1 : 0) )
      .radius(model.forceProperties.collide.radius)
      .iterations(model.forceProperties.collide.iterations);
      graph.d3Force("forceX")
      .strength(model.forceProperties.forceX.strength * (model.forceProperties.forceX.enabled === true ? 1 : 0) )
      .x(model.width * model.forceProperties.forceX.x);
      graph.d3Force("forceY")
      .strength(model.forceProperties.forceY.strength * (model.forceProperties.forceY.enabled === true ? 1 : 0) )
      .y(model.height * model.forceProperties.forceY.y);
      graph.d3Force("link")
      .distance(model.forceProperties.link.distance)
      .iterations(model.forceProperties.link.iterations)
      .links(model.forceProperties.link.enabled ? graph.graphData().links : []);

  graph.d3ReheatSimulation();
  simulationTicksCounter = 0;
}

function refreshData() {
  notifyListener(UIEvent.GET_DATA);
}

function notifyListener(event: UIEvent, value?: any) {
  if (graphListeners.has(event)) {
    graphListeners.get(event)(value);
  }
}

function setGraphDimensions() {
  const graphPanel = document.getElementById("graph");
  model.width = graphPanel.offsetWidth;
  model.height = window.innerHeight;
  graph.width(model.width);
  graph.height(model.height);
}

function rebuildTagsIndex() {

  //delete tag nodes
  model.tags.forEach((index) => {
    model.nodes.delete(index.tagNodeId);
  });

  const tags = new Map<string,TagIndex>();

  // collect all tags and count number of occurences
  model.nodes.forEach((node) => {
    node.tags.forEach((tag) => {
      let tagIndex = tags.get(tag);
      if (!tagIndex) {
        let tagNode = new Node(tag);
        tagNode.label = tag;
        tagNode.type = "tag";
        model.nodes.set(tagNode.id, new GraphNode(tagNode));
        tagIndex = { tagNodeId: tagNode.id, count: 0 };
        tags.set(tag, tagIndex);
      }
      tagIndex.count++;
      // create a link from tagNode to node
      let tagNode = model.nodes.get(tagIndex.tagNodeId);
      const link = {
        label: tag,
        sourceId: tagNode.id,
        targetId: node.id,
        type: "tag",
      };
      tagNode.rel.push(link);
    });
  });

  model.tags = tags;

  //re-render tags filter with updated suggestions
  const controlPanel = 
  < ControlPanel 
    suggestions={model.tags}
    forceProperties={model.forceProperties}
    showAllLinks={showAllLinks} 
    showTagNodes={showTagNodes}
    showOnlySelectedNodes={showOnlySelectedNodes}
    tagSelectionChanged={tagSelectionChanged}
    updateForces={updateForces}
    />;
    
  render(
    controlPanel,
    document.getElementById("controls")
);
}

/**
 * Filter and transform model to generate data to display
 */
function buildGraphData() {

  let graphData = {
    nodes: Array.from(model.nodes.values()),
    links: [],
  };

  //filter nodes
  if (model.nodeFilters.length > 0) {
    graphData.nodes = graphData.nodes.filter(node => applyFilters(node, model.nodeFilters));
  }

  // collect/filter relationships
  const filteredNodeIds = new Set(graphData.nodes.map(node => node.id));
  graphData.nodes.forEach((node) => {
    graphData.links.push(
      ...node.rel
        .filter(link => filteredNodeIds.has(link.sourceId) && filteredNodeIds.has(link.targetId))
        .filter(link => applyFilters(link, model.linkFilters))
        // !IMPORTANT we pass forceGraph a Link object so we can access the object attributes when drawing
        // however forceGraph will overwrite source and target attributes with full reference to nodes.
        .map( link => Object.assign(link, {source: link.sourceId, target: link.targetId}))
    );
  });

  graphData.nodes.forEach((node) => {
    //reset links
    node.links = [];
    node.backlinks = [];
  });

  //rebuild links
  graphData.links.forEach((link: Link) => {
    model.nodes.get(link.sourceId).links.push(link);
    model.nodes.get(link.targetId).backlinks.push(link);
  });


  addCurvature(graphData);

  return graphData;
}

function applyFilters(elt: any, filters: Filter[]) {
  for(let filter of filters) {
    if(!filter.filter(elt)) {
      return  false;
    }
  }
  return true;
}

function didGraphDataUpdate(graphData: GraphData) {
  graph.graphData(graphData);
}

function setupForceGraph() {
  graph
    .linkHoverPrecision(4)
    .backgroundColor(model.style.background)
    .linkWidth(() => model.style.link.width)
    .linkDirectionalParticleSpeed(0.01)
    .linkDirectionalParticles(1)
    .linkDirectionalParticleWidth((link: Link) =>
      getLinkState(link) === GraphObjectState.HIGHLIGHTED
        ? model.style.link.particleWidth
        : 0
    )
    .linkColor((link) => {
      const linkState = getLinkState(link as Link);
      return getLinkColor(linkState, link as Link);
    })
    .linkCurvature("curvature")
    .nodeCanvasObject((node: NodeObject & GraphNode, ctx, globalScale) => {
      const label = node.label;
      const size = getNodeSize(node);
      const nodeState = getNodeState(node);
      const { fill, border } = getNodeColor(nodeState, node);
      const labelX = node.x;
      const labelY = node.y + size + 1;
      const fontSize = RELATIVE_NODE_SIZE ? FONT_SIZE  * getLabelScaledSize(size) : FONT_SIZE;
      ctx.font = `${fontSize}px Sans-Serif`;
      Draw(ctx)
        .circle(node.x, node.y, size + 0.2, border) // border not handled by default
        .circle(node.x, node.y, size, fill)
        .text(label, labelX, labelY, fontSize, getLabelColor(nodeState));
      // const tooltipWidth = 40, tooltipHeight = 20;
      if (model.hoveredNode === node) {
        const descriptionSize = fontSize / 2;
        ctx.font = `${descriptionSize}px Sans-Serif`;
        ctx.fillStyle = d3
          .rgb(model.style.node.color)
          .copy({ opacity: 0.5 })
          .toString();
        ctx.fillText(node.id, labelX, labelY + fontSize, 40);
        // ctx.fillRect(labelX - tooltipWidth / 2, labelY + size, tooltipWidth, tooltipHeight);
      }
    });

    graph
      .d3Force("link", d3.forceLink() as any)
      .d3Force("charge", d3.forceManyBody() as any)
      .d3Force("collide", d3.forceCollide() as any)
      .d3Force("center", d3.forceCenter() as any)
      .d3Force("forceX", d3.forceX() as any)
      .d3Force("forceY", d3.forceY() as any)
      .warmupTicks(20)
      .cooldownTicks(500)
      .cooldownTime(4000);

  graph.onEngineTick(() => {
    let tick = simulationTicksCounter++;
    let maxTicks = graph.cooldownTicks();
    onEngineTick(tick, maxTicks);
  });

  graph.onEngineStop(() => {
    onEngineStop();
    simulationTicksCounter = 0;
  });

  graph
    .onNodeClick((node: GraphNode, event) => {
      handleNoteClick(node, event);
    })
    .onNodeHover((node: GraphNode) => {
      handleNodeHover(node);
    })
    .onBackgroundClick((event) => {
      handleBackgroundClick(event);
    });

  setGraphDimensions();
}

//action linked to key combinations
const multipleSelectionAction = (event: any) => event.getModifierState("Shift");
const openNoteAction = (event: any) =>
  event.getModifierState("Control") || event.getModifierState("Meta");

//single or multiple selection allowed
//ctrl click will open the note in the editor
function handleNoteClick(node: GraphNode, event: any) {
  if (!multipleSelectionAction(event)) {
    model.clearSelection();
  }
  model.selectNode(node);

  const open = openNoteAction(event);
  const validNoteIds = Array.from(model.selectedNodes).filter(node => node.type !== 'tag').map(node => node.id);
  const openNoteId = ( node.type !== 'tag' && open) ? node.id : undefined;

  if (graphListeners.get(UIEvent.NOTE_SELECTED)) {
    graphListeners.get(UIEvent.NOTE_SELECTED)( {
      noteIds: validNoteIds,
      openNoteId: openNoteId
    });
  }
}

function handleNodeHover(node: GraphNode) {
  model.hoverNode(node);
}

function handleBackgroundClick(event: MouseEvent) {
  if (!multipleSelectionAction(event)) {
    model.clearSelection();
  }
}

// more importance given to connected nodes
function getNodeSize(node: GraphNode) {
  return getNodeScaledSize(node.links.length + node.backlinks.length);
  
}

// define scale for node size
const getNodeScaledSize = d3
  .scaleLinear()
  .domain([0, 30])
  .range([1, 10])
  .clamp(true);

// define scale for node size
const getLabelScaledSize = d3
  .scaleLinear()
  .domain([1, 10])
  .range([1, 4])
  .clamp(true);

const Draw = (ctx: CanvasRenderingContext2D) => ({
  circle: function (
    x: number,
    y: number,
    radius: number,
    color: string | CanvasGradient | CanvasPattern
  ) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
    return this;
  },
  text: function (
    text: string,
    x: number,
    y: number,
    size: any,
    color: string | CanvasGradient | CanvasPattern
  ) {
    ctx.font = `${size}px Sans-Serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    return this;
  },
});

// dynamically figuring out color scheme for node labels
function getLabelColor(nodeState: GraphObjectState): string {
  const defaultColor = model.style.node.fontColor;

  switch (nodeState) {
    case GraphObjectState.HIGHLIGHTED:
      return model.style.node.highlightedColor;
    case GraphObjectState.LESSENED:
      return d3.rgb(defaultColor).copy({ opacity: 0.05 }).toString();
    case GraphObjectState.HIDDEN:
      return d3.rgb(defaultColor).copy({ opacity: 0 }).toString();
    case GraphObjectState.REGULAR:
    default:
      return defaultColor;
  }
}

// dynamically figuring out color scheme for nodes
function getNodeColor(
  nodeState: GraphObjectState,
  node: GraphNode
): { fill: string; border: string } {
  let defaultColor = model.style.node.color;
  let highlightcolor = model.style.node.highlightedColor;

  var isTag = node.type === "tag";

  if (isTag) {
    highlightcolor = model.style.tagNode.highlightColor;
    defaultColor = d3.hsl(highlightcolor).darker(2).toString();
  }

  let fill = defaultColor;
  let border = d3.hsl(defaultColor).darker(1).toString();

  switch (nodeState) {
    case GraphObjectState.HIGHLIGHTED:
      return {
        fill: highlightcolor,
        border: model.style.node.border.highlightedColor,
      };
    case GraphObjectState.LESSENED:
      return {
        fill: d3.rgb(fill).copy({ opacity: 0.1 }).toString(),
        border: d3.rgb(border).copy({ opacity: 0.1 }).toString(),
      };
    case GraphObjectState.HIDDEN:
      return {
        fill: d3.rgb(defaultColor).copy({ opacity: 0 }).toString(),
        border: d3.rgb(defaultColor).copy({ opacity: 0 }).toString(),
      };
    case GraphObjectState.REGULAR:
    default:
      return {
        fill: fill,
        border: border,
      };
  }
}

// dynamically figuring out color scheme for links
function getLinkColor(linkState: GraphObjectState, link: Link): string {
  let defaultColor = model.style.link.color;
  let highlightcolor = model.style.link.highlightedColor;

  if (link.type == "tag") {
    highlightcolor = model.style.tagNode.highlightColor;
    defaultColor = d3.hsl(highlightcolor).darker(2).toString();
  }

  switch (linkState) {
    case GraphObjectState.HIGHLIGHTED:
      return highlightcolor;
    case GraphObjectState.LESSENED:
      return d3.hsl(model.style.link.color).copy({ opacity: 0.1 }).toString();
    case GraphObjectState.HIDDEN:
      return d3.rgb(model.style.background).copy({ opacity: 0 }).toString();
    case GraphObjectState.REGULAR:
      return d3.rgb(defaultColor).copy({ opacity: 0.5 }).toString();
    default:
      return defaultColor;
  }
}

function getNodeState(node: GraphNode) {
  return model.focusedNodes.has(node)
    ? GraphObjectState.HIGHLIGHTED
    : model.hoveredNode
    ? GraphObjectState.LESSENED
    : GraphObjectState.REGULAR;
}

function getLinkState(link: any) {
  return model.focusedLinks.has(link)
  ? GraphObjectState.HIGHLIGHTED
  : model.hoveredNode
  ? GraphObjectState.LESSENED
  : GraphObjectState.REGULAR;
}

// state a graph object (node, link, label) can take
// as user interacts with the graph.
enum GraphObjectState {
  HIDDEN = 1,
  LESSENED = 2,
  REGULAR = 3,
  HIGHLIGHTED = 4,
}

//taken from https://github.com/vasturiano/force-graph/blob/master/example/curved-links-computed-curvature/index.html
function addCurvature(graphData: GraphData) {
  let selfLoopLinks = {};
  let sameNodesLinks = {};
  const curvatureMinMax = 0.5;

  // 1. assign each link a nodePairId that combines their source and target independent of the links direction
  // 2. group links together that share the same two nodes or are self-loops
  graphData.links.forEach((link: any) => {
    link.nodePairId =
      link.sourceId <= link.targetId
        ? link.sourceId + "_" + link.targetId
        : link.targetId + "_" + link.sourceId;
    let map = link.sourceId === link.targetId ? selfLoopLinks : sameNodesLinks;
    if (!map[link.nodePairId]) {
      map[link.nodePairId] = [];
    }
    map[link.nodePairId].push(link);
  });

  // Compute the curvature for self-loop links to avoid overlaps
  Object.keys(selfLoopLinks).forEach((id) => {
    let links = selfLoopLinks[id];
    let lastIndex = links.length - 1;
    links[lastIndex].curvature = 1;
    let delta = (1 - curvatureMinMax) / lastIndex;
    for (let i = 0; i < lastIndex; i++) {
      links[i].curvature = curvatureMinMax + i * delta;
    }
  });

  // Compute the curvature for links sharing the same two nodes to avoid overlaps
  Object.keys(sameNodesLinks)
    .filter((nodePairId) => sameNodesLinks[nodePairId].length > 1)
    .forEach((nodePairId) => {
      let links = sameNodesLinks[nodePairId];
      let lastIndex = links.length - 1;
      let lastLink = links[lastIndex];
      lastLink.curvature = curvatureMinMax;
      let delta = (2 * curvatureMinMax) / lastIndex;
      for (let i = 0; i < lastIndex; i++) {
        links[i].curvature = -curvatureMinMax + i * delta;
        if (lastLink.source !== links[i].source) {
          links[i].curvature *= -1; // flip it around, otherwise they overlap
        }
      }
    });
}


function applySetting(setting: Setting) {
  switch(setting.key) {
    case SettingLabel.COOLDOWN_TICKS:
      graph.cooldownTicks(setting.value as number);
      break;
    case SettingLabel.COOLDOWN_TIME:
      graph.cooldownTime(setting.value as number);
      break;
    case SettingLabel.WARMUP_TICKS:
      graph.warmupTicks(setting.value as number);
      break;
    case SettingLabel.FONT_SIZE:
      FONT_SIZE = setting.value as number;
      break;
    case SettingLabel.RELATIVE_FONT_SIZE:
      RELATIVE_NODE_SIZE = setting.value as boolean;
      break;
  }
}