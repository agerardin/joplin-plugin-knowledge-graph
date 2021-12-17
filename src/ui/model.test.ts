import Graph from "src/core/graph";
import { createLink, generateGraph, generateNodes, generateRandomGraph } from "../../test/tools/graph-generator";
import { Model } from "./model";
import Node from '../core/node';
import Link from "src/core/link";
import GraphNode from "./graph-node";
import { ID } from "src/core/definitions";


describe("Model", () => {

    describe("test Model capture groups (select/focus/hover) upon Model Actions.", () => {

        let model: Model, graph: Graph, nodes: Array<GraphNode>;

        beforeEach(() => {
            nodes = generateNodes(5).map(node => new GraphNode(node));
            createLink(nodes[0], nodes[1]);
            createLink(nodes[1], nodes[2]);
            createLink(nodes[1], nodes[3]);
            createLink(nodes[2], nodes[4]);
            createLink(nodes[3], nodes[4]);
            graph = generateGraph(nodes, 'test-graph');
        
            model = new Model();
            model.nodes = graph.nodes as Map<ID, GraphNode>;
            //connect all nodes
            Array.from(model.nodes.values()).flatMap((node : Node) => node.rel).forEach((link: Link) => {
                model.nodes.get(link.sourceId).links.push(link);
                model.nodes.get(link.targetId).backlinks.push(link);
              });
        });

        it("select one node", async () => {
            model.selectNode(nodes[0]);
            expect(model.selectedNodes.size).toBe(1);
            expect(model.focusedNodes.size).toBe(2);
            expect(model.focusedLinks.size).toBe(1);
        })

        it("select multiple nodes", async () => {
            model.selectNode(nodes[0]);
            model.selectNode(nodes[4]);
            expect(model.selectedNodes.size).toBe(2);
            expect(model.focusedNodes.size).toBe(5);
            expect(model.focusedLinks.size).toBe(3);
        })

        it("select multiple nodes", async () => {
            model.selectNode(nodes[0]);
            model.selectNode(nodes[4]);
            model.selectNode(nodes[1]);
            expect(model.selectedNodes.size).toBe(3);
            expect(model.focusedNodes.size).toBe(5);
            expect(model.focusedLinks.size).toBe(5);
        })

        it("select and unselect node", async () => {
            model.selectNode(nodes[0]);
            model.selectNode(nodes[4]);
            model.selectNode(nodes[1]);
            model.unselectNode(nodes[1]);
            expect(model.selectedNodes.size).toBe(2);
            expect(model.focusedNodes.size).toBe(5);
            expect(model.focusedLinks.size).toBe(3);
        })

        it("select one link", async () => {
            model.selectLink(nodes[1].links[0]);
            expect(model.selectedNodes.size).toBe(0);
            expect(model.focusedNodes.size).toBe(2);
            expect(model.focusedLinks.size).toBe(1);
            expect(model.selectedLinks.size).toBe(1);
        })

        it("select two link", async () => {
            model.selectLink(nodes[1].links[0]);
            model.selectLink(nodes[1].links[1]);
            expect(model.selectedNodes.size).toBe(0);
            expect(model.focusedNodes.size).toBe(3);
            expect(model.focusedLinks.size).toBe(2);
            expect(model.selectedLinks.size).toBe(2);
        })

        it("select and unselect link", async () => {
            model.selectLink(nodes[1].links[0]);
            model.selectLink(nodes[1].links[1]);
            model.unselectLink(nodes[1].links[0]);
            expect(model.selectedNodes.size).toBe(0);
            expect(model.selectedLinks.size).toBe(1);
            expect(model.focusedNodes.size).toBe(2);
            expect(model.focusedLinks.size).toBe(1);
            
        })

    });

});