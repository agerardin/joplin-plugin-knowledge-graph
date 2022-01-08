import {ID} from './definitions'

export type LINK_TYPE = string;

export default class Link {
    sourceId: ID
    targetId: ID
    type: LINK_TYPE
    label?: string
    position?: {start: number, end:number};

    constructor(sourceId: string, targetId: string, type? : LINK_TYPE) {
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.type = type;
    }
}