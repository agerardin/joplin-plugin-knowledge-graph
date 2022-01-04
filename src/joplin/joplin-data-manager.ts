import { ID, LOCAL_GRAPH_ID } from "../core/definitions";
import Node from "../core/node";
import Graph from "../core/graph";
import Note, { buildNodeFromNote } from "./note";
import JoplinDataApi from "./joplin-data-api";

export default class JoplinDataManager {
  dataApi_ = JoplinDataApi.instance();
  nodes = new Map<ID, Node>();
  graphs = new Map<ID, Graph>();

  private static instance_: JoplinDataManager;

  static instance(): JoplinDataManager {
    if (!this.instance_) {
      this.instance_ = new JoplinDataManager();
    }
    return this.instance_;
  }

  async getAllNodes(): Promise<Map<ID, Node>> {

    const nodes: Map<ID, Node> = new Map();
    const notes = (await this.collectAllNotes()).notes;

    notes.forEach((note) => {
      const node = buildNodeFromNote(note);
      node.graphId = LOCAL_GRAPH_ID;
      nodes.set(node.id, node);
    });

    return nodes;
  }

  async getNode(noteId: ID): Promise<Node> {
    const note = await this.dataApi_.getNote(this.buildNoteQueryParams(), noteId);
    const node = buildNodeFromNote(note);
    node.graphId = LOCAL_GRAPH_ID;
    return node;
  }

  private buildNoteQueryParams() {
    return this.dataApi_.buildQueryParams({
      fields: ["id", "parent_id", "title", "body"],
      order_dir: "DESC",
    });
  }

  /**
   * Build a graph up to @param maxDegree from source node and up to a @param maxNotes cutoff.
   * Breadth-first implementation.
   * Bad links are discarded, unvisited links are flagged.
   * @param sourceId starting note.
   * @param maxDegree max degree of separation from the source note.
   * @param maxNotes cutoff
   * @returns a graph of notes
   */
  private async collectNotesInRange(
    sourceId: string,
    maxDegree: number,
    maxNotes: number = Number.MAX_SAFE_INTEGER
  ) {
    let pending = [];
    const notes = new Map<string, Note>();
    const missingNotes = [];
    let degree = 0;
    let truncated = false;

    pending.push(sourceId);
    do {
      // do not fetch data already in the graph
      pending = pending.filter((id) => !notes.has(id));

      const { results, idsNotFound } = await this.dataApi_.getNotesByIds(
        this.buildNoteQueryParams(),
        pending
      );
      pending = [];

      for (let note of results) {
        note.degree = degree; // track distance from sourceId
        if (degree == maxDegree) {
          note.visitLinks = false; // its links are out of scope and should not be visited.
          if (note.links.length != 0)
            console.warn(`unvisited links : ${note.links}`);
        }

        notes.set(note.id, note);

        note.links.forEach((link) => {
          if (!notes.has(link.noteId)) {
            pending.push(link);
          }
        });

        if (notes.size > maxNotes) {
          truncated = true;
          break;
        }
      }

      missingNotes.push(...idsNotFound);

      degree++;
    } while (pending.length > 0 && degree <= maxDegree && !truncated);

    this.discardBadLinks(notes, missingNotes, degree);

    return {
      notes: Array.from(notes.values()),
      missingNotes: missingNotes,
      degree: degree,
      truncated: truncated,
    };
  }

  /**
   * Build the full note graph up to a cutoff.
   * @param maxNotes cutoff
   * @returns a graph of notes
   */
  private async collectAllNotes(maxNotes: number = Number.MAX_SAFE_INTEGER) {
    const notes = new Map<string, Note>();
    let { results, truncated } = await this.dataApi_.getNotes(
      this.buildNoteQueryParams(),
      maxNotes
    );

    results.forEach((note) => {
      notes.set(note.id, note);
    });

    // if truncated, we have received some nodes according to the query criteria.
    // We cannot know for sure if we have bad links or unvisited links so keep them around.
    if (!truncated) {
      this.discardBadLinks(notes);
    }

    return { notes: Array.from(notes.values()), truncated: truncated };
  }

  /**
   * Discard links with targets that do not exist.
   */
  private discardBadLinks(
    notes: Map<string, Note>,
    idsNotFound: Array<string> = [],
    maxDegree: number = Infinity
  ) {
    let badLinks = [];

    for (let note of notes.values()) {
      let i = note.links.length;

      while (i--) {
        let link = note.links[i];

        if (idsNotFound.includes(link.noteId)) {
          // either we have built a partial graph and bad links have been flagged
          badLinks.push(link);
          note.links.splice(i, 1);
        } else if (note.visitLinks && !notes.has(link.noteId)) {
          // or we have built the full graph and it should be consistent
          badLinks.push(link);
          note.links.splice(i, 1);
        }
      }
    }

    if (badLinks.length != 0) {
      console.warn(`bad links : ... ${badLinks}`);
    }
  }
}
