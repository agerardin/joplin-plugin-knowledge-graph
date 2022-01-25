import ForceGraph, {
  NodeObject,
  GraphData,
} from "force-graph";
import React from "react";
import { render } from "react-dom";
import * as d3 from "d3";

import { ID } from "../core/definitions";
import Link from "../core/link";
import Node, { NODE_TYPE } from "../core/node";
import GraphUpdate from "../core/graph-update";
import { Filter,  FilterKey, Model} from "./model";
import { UIEvent } from "../common/message";
import { onEngineTick, onEngineStop } from "./control-panels/control-panel";
import GraphNode from "./graph-node";
import { Setting, SettingLabel } from "../core/settings";
import Menu from './control-panels/menu';
import Button from '@mui/material/Button';

import './graph-ui.css'
import { Tag } from "src/core/tag";
import Graph from "src/core/graph";
import { Color, HSLColor, RGBColor } from "d3";


const elem = document.getElementById("graph");
let graph = ForceGraph()(elem);
const  model = new Model(graph);

let simulationTicksCounter = 0;

let FONT_SIZE = 3; 
let SCALED_LABEL = true;
let WEIGHTED_LABEL = true;
let PAINT_PHOTONS_ON_CLICK = true;
let PAINT_PHOTONS_ON_HOVER = true;
let MENU_PANEL_SIZE = 15;
let SHOW_MENU = true;
let SHOW_TAG_NODES = true;  
let SHOW_ONLY_SELECTED = false;
let SHOW_ALL_LINKS = true;
let COMPUTE_STATS = SCALED_LABEL;

let graphListeners: Map<UIEvent, Function> = new Map();


setupForceGraph();

window.addEventListener(
  "resize",
  function (_) {
    setGraphDimensions();
  },
  true
);

const toggleMenu = () => {
  SHOW_MENU = !SHOW_MENU; updateReactMenuComponent(SHOW_MENU);
};

function updateReactMenuComponent(show: boolean) {

  const menu = 
  < Menu 
    suggestions={model.tagIndex}
    forceProperties={model.forceProperties}
    allLinks={SHOW_ALL_LINKS}
    tagNodes={SHOW_TAG_NODES}
    onlySelected={SHOW_ONLY_SELECTED}
    showAllLinks={showAllLinks} 
    showTagNodes={showTagNodes}
    showOnlySelectedNodes={showOnlySelectedNodes}
    tagSelectionChanged={tagSelectionChanged}
    updateForceProperties={updateForceProperties}
    resetForces={resetForces}
    openPanel={show}
    panelDidClose={toggleMenu}
    panelSize={MENU_PANEL_SIZE}
  />;
    
  render(
    menu,
    document.getElementById("menu")
 );

 const control = (
  <div>
    { !SHOW_MENU &&
      <Button variant="outlined" size="small" title='show controls' onClick={toggleMenu}>
        <i className="fas fa-chevron-left"></i>
      </Button>}
  </div>
  );
  
  render(
    control,
    document.getElementById("control")
  );
}

/**
 * Register listeners for events.
 * @param {*} event Event to listen to
 * @param {*} callback triggered when a event is emitted
 */
export function on(event: UIEvent, callback: Function) {
  graphListeners.set(event, callback);
}

export function resumeAnimation(resume: boolean) {
  if(resume) {
    graph.resumeAnimation();
  }
  else {
    graph.pauseAnimation();
  }
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

  graph.centerAt(centroid.x,centroid.y, 300);
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
    // data api collapses add/update so node may not exists
    (node) ? Object.assign(node, update) : model.nodes.set(update.id, new GraphNode(update));
    nodeIds.push(update.id);
  });

  updateTagIndex(update.tagIndex);
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
  didSelectNodes(nodeIds);
}

/** Apply implicit diff between the old model and the new one for smooth transition */
export function didFullModelUpdate(graph: Graph) {
  model.nodes.forEach((del) => {
    if (!graph.nodes.has(del.id)) {
      model.nodes.delete(del.id);
    }
  });
  graph.nodes.forEach((update) => {
    if (!model.nodes.has(update.id)) {
      model.nodes.set(update.id, new GraphNode(update));
    } else {
      const oldNode = model.nodes.get(update.id);
      Object.assign(oldNode, update);
    }
  });

  updateTagIndex(graph.tagIndex);
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
}

export function didSettingsUpdate(settings : Setting[]) {
  settings.forEach( (setting : any) => {
    applySetting(setting);
  });
}

function showAllLinks(show: boolean) {

  SHOW_ALL_LINKS = show;
  updateReactMenuComponent(SHOW_MENU);

  model.showAllLinks = show;
  if (!model.showAllLinks) {
    graph.linkCurvature(0);
  } else {
    graph.linkCurvature("curvature");
  }
}

function showTagNodes(show: boolean) {

  SHOW_TAG_NODES = show;
  updateReactMenuComponent(SHOW_MENU);

  model.showTagNodes = show;
  model.nodeFilters = model.nodeFilters.filter((filter : Filter) => filter.name !== FilterKey.TAG_NODE);
  if (!model.showTagNodes) {
    model.nodeFilters.push( {name: FilterKey.TAG_NODE, filter: (node: GraphNode) => node.type != NODE_TYPE.TAG} );
  }
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
}

function showOnlySelectedNodes(show: boolean) {

  SHOW_ONLY_SELECTED = show;
  updateReactMenuComponent(SHOW_MENU);

  model.nodeFilters = model.nodeFilters.filter((filter : Filter) => filter.name !== FilterKey.ONLY_SELECTED_NODE);
  if (show) {
    model.nodeFilters.push( {name: FilterKey.ONLY_SELECTED_NODE, filter: (node: GraphNode) => model.focusedNodes.has(node)} );
  }
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
  // // graph.zoomToFit(300, 10, () => true);
  // let bbox = graph.getGraphBbox();
  // let x = ( bbox.x[0] + bbox.x[1] ) / 2;
  // let y = ( bbox.y[0] + bbox.y[1] ) / 2;
  // graph.centerAt(x, y);

  
}

function tagSelectionChanged(tags: any[]) {
  model.nodeFilters = model.nodeFilters.filter((filter : Filter) => filter.name !== FilterKey.TAG_SELECTION);
  if(tags.length > 0) {
    model.nodeFilters.push( {name: FilterKey.TAG_SELECTION, filter: (node: GraphNode) => {
      const found = tags.findIndex(tag => (node.type == NODE_TYPE.TAG && node.id == tag.id) || node.tags.has(tag.id)) != -1
      return found;
    }
   });
  }
  const graphData = buildGraphData();
  didGraphDataUpdate(graphData);
}

function updateForceProperties(updatedForceProperties) {
  model.forceProperties = updatedForceProperties;
  updateReactMenuComponent(SHOW_MENU);
  updateForces();

}

function updateForces() {
  graph.d3Force("center")
      .x(model.width * model.forceProperties.center.x.value * (model.forceProperties.center.enabled === true ? 1 : 0))
      .y(model.height * model.forceProperties.center.y.value * (model.forceProperties.center.enabled === true ? 1 : 0));
  
  graph.d3Force("charge")
      .strength(model.forceProperties.charge.strength.value * (model.forceProperties.charge.enabled === true ? 1 : 0) )
      .distanceMin(model.forceProperties.charge.distanceMin.value)
      .distanceMax(model.forceProperties.charge.distanceMax.value);
  
  graph.d3Force("collide")
      .strength(model.forceProperties.collide.strength.value * (model.forceProperties.collide.enabled === true ? 1 : 0) )
      .radius(model.forceProperties.collide.radius.value)
      .iterations(model.forceProperties.collide.iterations.value);

  if(!model.forceProperties.link.enabled) {
    graph.d3Force("link",null);
    graph.d3Force("forceX").strength(0);
    graph.d3Force("forceY").strength(0);
  }
  else {
    graph.d3Force("link", d3.forceLink(graph.graphData().links as any) as any)
    graph.d3Force("forceX")
    .strength(model.forceProperties.forceX.strength * (model.forceProperties.forceX.enabled === true ? 1 : 0) )
    .x(model.forceProperties.forceX.x);
    graph.d3Force("forceY")
    .strength(model.forceProperties.forceY.strength * (model.forceProperties.forceY.enabled === true ? 1 : 0) )
    .y(model.forceProperties.forceY.y);
  }

  graph.d3ReheatSimulation();
  simulationTicksCounter = 0;
}

function resetForces() {
  model.resetForces();
  graph.graphData().nodes.forEach(node => {
    node.x = undefined;
    node.y = undefined;
  });
  didGraphDataUpdate(graph.graphData());
  updateForceProperties(model.forceProperties);
}

function notifyListener(event: UIEvent, value?: any) {
  if (graphListeners.has(event)) {
    graphListeners.get(event)(value);
  }
}

function setGraphDimensions() {
  const graphPanel = document.getElementById("graph");
  
  model.width = window.innerWidth;
  model.height = window.innerHeight;

  graph.width(model.width);
  graph.height(model.height);
}

function updateTagIndex(tagIndex : Map<string, Tag>) {
  model.tagIndex = tagIndex;

  if(SHOW_MENU) {
    updateReactMenuComponent(SHOW_MENU);
  }
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
    graphData.nodes = graphData.nodes.filter(node => {
      return applyFilters(node, model.nodeFilters)
    });
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
        .map( (link: any) => 
          link.source && link.target
          ? link
          : Object.assign(link, 
            {
              source: link.sourceId,
              target: link.targetId,
              type:link.type,
              label:`${model.nodes.get(link.sourceId).label}
                    ->
                    ${model.nodes.get(link.targetId).label}`
            })
        )
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

  if(COMPUTE_STATS) {
    graphData.nodes.forEach(node => collectStats(node));
    computeStats();
    console.log("degrees", degrees);
    console.log("hist",histogram);
  }

  addCurvature(graphData);

  return graphData;
}

let maxDegree = 0;
let degrees = new Map<number,number>();

function collectStats(node : GraphNode) {
  let degree = getNodeWeigth(node);
  maxDegree =  degree > maxDegree ? degree : maxDegree;
  degrees.has(degree) ? degrees.set(degree, degrees.get(degree) + 1) : degrees.set(degree, 1);
}

let nbOfBuckets = 10.0;
let histogram = Array(nbOfBuckets).fill(0);

function computeStats() {
  let step = (maxDegree + 1/maxDegree) / nbOfBuckets;
  for(let i = 0; i <= maxDegree; i++) {
    if(degrees.has(i)) {
      histogram[Math.floor(i / step)] += degrees.get(i);
    }
  }
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
    .linkHoverPrecision(1)
    .nodeRelSize(1)
    .nodeVal((node: GraphNode) => {
      return getNodeWeigth(node);
    })
    .backgroundColor(model.style.background)
    .linkWidth(() => model.style.link.width)
    .nodeColor((node: GraphNode) => {
      const nodeState = getNodeState(node);
      const {fill} = getNodeColor(nodeState, node);
      return fill.toString();
    })
    .linkColor((link: Link) => {
      const linkState = getLinkState(link);
      return getLinkColor(linkState, link);
    })
    .linkCurvature("curvature")
    .nodeCanvasObject((node: NodeObject & GraphNode, ctx, globalScale) => {
      paintNode(node, ctx, globalScale);
    })
    .nodeCanvasObjectMode(() => 'after');

    graph
      .d3Force("link", d3.forceLink() as any)
      .d3Force("charge", d3.forceManyBody() as any)
      .d3Force("collide", d3.forceCollide() as any)
      .d3Force("center", d3.forceCenter() as any)
      .d3Force('forceX', d3.forceX() as any)
      .d3Force('forceY', d3.forceY() as any)

    updateForces();

    let link = graph.d3Force("link");

    graph
    .autoPauseRedraw(true);

  graph.onEngineTick(() => {
    /* cannot take into account cooldownTime since there is 
     * no way to know the elapsed time as computed by the simulation
     */
    let tick = simulationTicksCounter++;
    let maxTicks = graph.cooldownTicks();
    let progress = (tick * 100 / maxTicks);
    onEngineTick(progress);
  });

  graph.onEngineStop(() => {
    onEngineStop();
    simulationTicksCounter = 0;
  });

  graph.cooldownTime(15000);
  graph.cooldownTicks(500);

  graph
    .onNodeClick((node: GraphNode, event) => {
      handleNoteClick(node, event);
    })
    .onNodeHover((node: GraphNode) => {
      handleNodeHover(node);
    })
    .onNodeDrag((node: GraphNode) => {
      handleNodeDrag(node);
    })
    .onBackgroundClick((event) => {
      handleBackgroundClick(event);
    });

  setGraphDimensions();
}

function paintNode(node: GraphNode, ctx : CanvasRenderingContext2D, globalScale: number) {
  /* label size */
  const nodeRelSize = graph.nodeRelSize(); //relative scale between nodes & links
  const size = nodeRelSize * getNodeWeigth(node); //node area based on node weight
  let labelSize = SCALED_LABEL ?  FONT_SIZE / globalScale : FONT_SIZE; //scale label depending on zoom level
  labelSize = WEIGHTED_LABEL ?  labelSize * controlLabelSizeWrtNodeSize(size) : FONT_SIZE;

  // if(node.type === NODE_TYPE.TAG) {
  //   console.log(graph.nodeRelSize())
  // }

  const scaledWeight = d3
  .scaleLinear()
  .domain([1, 5])
  .range([0, 1])
  .clamp(true);

  const scaledGlobalScale = d3
  .scaleLinear()
  .domain([0.5, 5])
  .range([0.2, 1])
  .clamp(true);

  const finalScale = d3
  .scaleLinear()
  .domain([0, 1])
  .range([0, 1])
  .clamp(true);
  
  const labelX = node.x;
  const labelY = node.y + Math.sqrt(size);
  
  /* label color */
  const nodeState = getNodeState(node);
  // adapt opacity based on zoom level to reduce noise
  let labelColor = getLabelColor(node, nodeState);
  // let scaleComponent = Math.pow(scaledGlobalScale(globalScale),2);
  let sizeComponent = scaledWeight(Math.sqrt(size));
  // labelColor = labelColor.copy({
  //   opacity:
  //     nodeState === GraphObjectState.REGULAR
  //       ? Math.log(1 + finalScale( scaleComponent + sizeComponent + scaleComponent * sizeComponent ))
  //       : nodeState === GraphObjectState.HIGHLIGHTED
  //       ? 1
  //       : labelColor.opacity
  // });

  const label = node.label;

  Draw(ctx)
    .text(label, labelX, labelY, labelSize, labelColor.toString());
  
  // if (model.hoveredNode === node) {
  //   const descriptionSize = fontSize / 2;
  //   ctx.font = `${descriptionSize}px Sans-Serif`;
  //   ctx.fillStyle = d3
  //     .rgb(model.style.node.color)
  //     .copy({ opacity: 0.5 })
  //     .toString();
  //   ctx.fillText(node.id, labelX, labelY + fontSize, 40);
  //   // const tooltipWidth = 40, tooltipHeight = 20;
  //   // ctx.fillRect(labelX - tooltipWidth / 2, labelY + size, tooltipWidth, tooltipHeight);
  // }
}

// Opacity based on the zoom level. May need adjustment.
const getNodeLabelOpacity = d3
  .scaleLinear()
  .domain([0, 1])
  .range([0, 1])
  .clamp(true);



const controlLabelSizeWrtNodeSize = d3
  .scaleLinear()
  .domain([0, 30])
  .range([1, 3])
  .clamp(true);

  const  controlLabelSizeWrtScale = d3
  .scaleLinear()
  .range([12, 14])
  .clamp(true);

 

//action linked to key combinations
const multipleSelectionAction = (event: any) => event.getModifierState("Shift");
const openNoteAction = (event: any) =>
  event.getModifierState("Control") || event.getModifierState("Meta");

//single or multiple selection allowed
//ctrl click will open the note in the editor
function handleNoteClick(node: GraphNode, event: any) {

  if(PAINT_PHOTONS_ON_CLICK) emitParticle(node);

  if (model.selectedNodes.has(node)) {
    model.unselectNode(node);
  } 
  else {
    if (!multipleSelectionAction(event)) {
      model.clearSelection();
    }
    model.selectNode(node);
    const open = openNoteAction(event);
    const validNoteIds = Array.from(model.selectedNodes).filter(node => node.type !== NODE_TYPE.TAG).map(node => node.id);
    const openNoteId = ( node.type !== NODE_TYPE.TAG && open) ? node.id : undefined;
  
    notifyListener(UIEvent.NOTE_SELECTED, {
      noteIds: validNoteIds,
      openNoteId: openNoteId
    });
  }

  animate();
}

function emitParticle(node: GraphNode) {
  node.links.forEach( link => graph.emitParticle(link));
  node.backlinks.forEach( link => graph.emitParticle(link));
}

function handleNodeHover(node: GraphNode) {
  if(node && PAINT_PHOTONS_ON_HOVER) {
    emitParticle(node);
  }
  model.hoverNode(node);
  animate();
}

function handleNodeDrag(node: GraphNode) {
  model.hoverNode(node);
  animate();
}

function handleBackgroundClick(event: MouseEvent) {
  if (!multipleSelectionAction(event)) {
    model.clearSelection();
  }
  animate();
}

function animate() {
  graph.nodeCanvasObject((node: NodeObject & GraphNode, ctx, globalScale) => {
    paintNode(node, ctx, globalScale);
  });
  graph.nodeColor(graph.nodeColor())
}

// more importance given to connected nodes
function getNodeWeigth(node: GraphNode) {
  const weight = node.links.length + node.backlinks.length;
  return (weight > 0) ? weight : 1;
}

const getNodeSize = d3
  .scaleLinear()
  .domain([0, 30])
  .range([0.5, 2])
  .clamp(true);

// define scale for node size
const getNodeScaledSize = d3
  .scaleLinear()
  .domain([0, 20])
  .range([1, 20])
  .clamp(true);

// define scale for node size
const getLabelScaledSize = d3
  .scaleLinear()
  .domain([1, 50])
  .range([1, 10])
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
function getLabelColor(node: GraphNode, nodeState: GraphObjectState): HSLColor {
  let fill = d3.hsl(model.style.fontColor);

  switch (nodeState) {
    case GraphObjectState.HIGHLIGHTED:
      return d3.hsl(model.style.fontColor).brighter();
    case GraphObjectState.LESSENED:
      return fill.copy({ opacity: 0.15 });
    case GraphObjectState.HIDDEN:
      return fill.copy({ opacity: 0 });
    case GraphObjectState.REGULAR:
    default:
      return fill;
  }
}

// dynamically figuring out color scheme for nodes
function getNodeColor(
  nodeState: GraphObjectState,
  node: GraphNode
): { fill: HSLColor; border: HSLColor } {
  let defaultColor = d3.hsl(model.style.node.color);
  let highlightcolor = d3.hsl(model.style.node.highlightedColor);
  let selectedColor = d3.hsl(model.style.node.selectedColor);

  var isTag = node.type === NODE_TYPE.TAG;

  if (isTag) {
    highlightcolor = d3.hsl(model.style.tagNode.highlightColor);
    selectedColor = d3.hsl(model.style.tagNode.selectedColor);
    defaultColor = d3.hsl(highlightcolor).darker(2);
  }

  let fill = defaultColor;
  let border = defaultColor.darker(1);

  switch (nodeState) {
    case GraphObjectState.HOVERED:
      return {
        fill: highlightcolor,
        border: d3.hsl(model.style.node.border.highlightedColor),
      };
    case GraphObjectState.SELECTED:
      return {
        fill: selectedColor,
        border: d3.hsl(model.style.node.border.highlightedColor),
      };
    case GraphObjectState.HIGHLIGHTED:
      return {
        fill: highlightcolor,
        border: d3.hsl(model.style.node.border.highlightedColor),
      };
    case GraphObjectState.LESSENED:
      return {
        fill: d3.hsl(fill).copy({ opacity: 0.1 }),
        border: d3.hsl(border).copy({ opacity: 0.1 }),
      };
    case GraphObjectState.HIDDEN:
      return {
        fill: d3.hsl(defaultColor).copy({ opacity: 0 }),
        border: d3.hsl(defaultColor).copy({ opacity: 0 }),
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

  if (link.type == "TAG") {
    highlightcolor = model.style.tagNode.highlightColor;
    defaultColor = d3.hsl(highlightcolor).darker(2).toString();
  }

  const scaledGlobalScale = d3
  .scaleLinear()
  .domain([0, 10])
  .range([0, 1])
  .clamp(true);

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
  return model.selectedNodes.has(node) //selected nodes are distinguished
    ? GraphObjectState.SELECTED 
    : model.hoveredNode == node //hover node needs cues
    ? GraphObjectState.HOVERED
    : model.focusedNodes.has(node) // focused nodes are emphasized
    ? GraphObjectState.HIGHLIGHTED
    : model.focusedNodes.size != 0 //when some nodes are in focus, de-emphasize others 
    ? GraphObjectState.LESSENED
    : GraphObjectState.REGULAR; //no selection, no hover
}

//TODO add secondary links with more focus (XOR : source or target is part of the focus group but not both)
function getLinkState(link: any) {
  return model.focusedLinks.has(link) //links in focus are highlighted
  ? GraphObjectState.HIGHLIGHTED
  : model.focusedNodes.size !== 0 // if some focus, then we lessened all others
  ? GraphObjectState.LESSENED
  : GraphObjectState.REGULAR;
}

// state a graph object (node, link, label) can take
// as user interacts with the graph.
enum GraphObjectState {
  HIDDEN = 'HIDDEN',
  LESSENED = 'LESSENED',
  REGULAR = 'REGULAR',
  HIGHLIGHTED = 'HIGHLIGHTED',
  SELECTED = 'HOVERED',
  HOVERED = 'SELECTED'
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
    case SettingLabel.SCALED_LABEL:
      SCALED_LABEL = setting.value as boolean;
      COMPUTE_STATS = SCALED_LABEL;
      break;
    case SettingLabel.PAINT_PHOTONS_ON_CLICK:
      PAINT_PHOTONS_ON_CLICK = setting.value as boolean;
      break;
    case SettingLabel.PAINT_PHOTONS_ON_HOVER:
      PAINT_PHOTONS_ON_HOVER = setting.value as boolean;
      break;
    case SettingLabel.SHOW_MENU_ON_START:
      SHOW_MENU = setting.value as boolean;
      updateReactMenuComponent(SHOW_MENU);
      break;
    case SettingLabel.MENU_PANEL_SIZE:
      MENU_PANEL_SIZE = setting.value as number;
      updateReactMenuComponent(SHOW_MENU);
      break;
  }
}