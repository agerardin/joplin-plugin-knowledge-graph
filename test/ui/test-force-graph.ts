import * as d3 from "d3";
import ForceGraph, {
  NodeObject,
  LinkObject,
  ForceGraphInstance,
} from "force-graph";

const elem = document.getElementById("graph");

const N = 300;

const initLinks = () =>
  [...Array(N - 1).keys()].map((id) => ({
    source: id,
    target: id + 1,
  }));

  const initNodes = () => [...Array(N).keys()].map((i) => ({ id: i }));

const gData = {
  nodes: initNodes(),
  links: initLinks(),
};

const createRandomLink = () => { return {source: Math.floor(Math.random() * N), target: Math.floor(Math.random() * N) }}; 

const button = document.getElementById("updateLinks");
button.addEventListener("click", (_) => {
  gData.nodes = initNodes();

  graph.graphData(gData);
});

let graph = ForceGraph()(elem).graphData(gData);
