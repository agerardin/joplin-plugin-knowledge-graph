import Link from "../core/link";
import Node from "../core/node";
import NoteLink from "./note-link";
import { parseNoteBody } from './mkdown-parser';

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
  
  parseNoteBody(joplinNote.body, note);

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
  node.type = 'note';
  return node;
}
