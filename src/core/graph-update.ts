import Node from "./node";
import { ID } from "./definitions";
import { Tag } from "./tag";

export default class GraphUpdate {
  graphId: ID;
  add?: Node[] = [];
  update?: Node[] = [];
  delete?: ID[] = [];
  tagIndex?: Map<string, Tag> = new Map();


  constructor(graphId : ID) {
      this.graphId = graphId;
    };

  isEmpty() {
    return (
      this.add.length == 0
      && this.update.length == 0
      && this.delete.length == 0
    );
  }
}
