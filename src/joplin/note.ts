import Link from "../core/link";
import Node, { NODE_TYPE } from "../core/node";
import NoteLink from "./note-link";
import { ID } from "src/core/definitions";

export default interface Note {
  id: string;
  title: string;
  links: NoteLink[];
  parentId?: string;
  body?: string;
  degree?: number;
  visitLinks?: boolean;
  tags?: string[];
}

export function parseJoplinNote(joplinNote : any) : Note {
  const note = {
    id: joplinNote.id,
    title: joplinNote.title,
    links: [],
  };
  
  note.links = parseNoteLinks(joplinNote);

  return note;
}

export function buildNodeFromNote(note: Note): Node {
  const node = new Node(note.id);
  node.label = note.title;
  note.links?.forEach( noteLink => {
    let link = new Link(note.id, noteLink.noteId);
    link.type = noteLink.type;
    link.label = noteLink.label;
    link.position = noteLink.position;
    node.rel.push(link);
  });
  note.tags?.forEach(tag => node.tags.add(tag));
  node.type = NODE_TYPE.NOTE
  return node;
}

export function parseNoteLinks(joplinNote: any) : NoteLink[] {
  const links : NoteLink[] = [];
  // TODO: needs to handle resource links vs note links. see 4. Tips note for
  // webclipper screenshot.
  // https://stackoverflow.com/questions/37462126/regex-match-markdown-link
  const linkRegexp = /\[\]|\[.*?\]\(:\/(.*?)\)/g;
  var match = linkRegexp.exec(joplinNote.body);
  while (match != null) {
    if (match[1] !== undefined) {
      const target = match[1];

      let [noteId, elementId] = target.split('#');

      const link = {
        noteId: noteId,
        elementId: elementId
      }

      links.push(link);
    }
    match = linkRegexp.exec(joplinNote.body);
  }
  return links;
}