import {ID} from './definitions'

export default class Link {
    sourceId: ID
    targetId: ID
    label?: string
    type?: string
    position?: {start: number, end:number};

    constructor(sourceId: string, targetId: string) {
        this.sourceId = sourceId;
        this.targetId = targetId;
    }
}