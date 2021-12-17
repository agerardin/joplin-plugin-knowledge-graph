import { ID } from "./definitions";
import Link from './link';

export default class Node {
    id: ID
    label: string;
    rel: Array<Link> = []
    tags: Set<string> = new Set();
    type: string;
    graphId: ID;

    constructor(id : ID) { 
        this.id = id;
    }
}