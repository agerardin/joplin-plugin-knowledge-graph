import { ID } from "./definitions";
import Link from './link';

export enum NODE_TYPE {
    NOTE = "NOTE",
    TAG = "TAG"
}

export default class Node {
    id: ID
    label: string;
    rel: Array<Link> = [];
    tags: Set<string> = new Set();
    type: NODE_TYPE;
    graphId: ID;

    constructor(id : ID) { 
        this.id = id;
    }
}