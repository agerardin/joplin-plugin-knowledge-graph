import Node from './node'
import { ID } from './definitions';

export default class GraphUpdate {
        graphId : ID;
        add?: Node[];
        update?: Node[];
        delete?: ID[];
}