import Link from "../core/link";
import Node from "../core/node";

export default interface Note {
  id: string;
  title: string;
  links: Link[];
  body: string;
  degree?: number;
  visitLinks?: boolean;
  tags?: string[];
}

export function parseJoplinNote(joplinNote : any) : Note {
  const note = {
    id: joplinNote.id,
    title: joplinNote.title,
    body: joplinNote.body,
    links: parseNoteLinks(joplinNote),
  }
  return note;
}

export function buildNodeFromNote(note: Note): Node {
  const node = new Node(note.id);
  node.label = note.title;
  note.links.forEach( link =>node.rel.push(link));
  note.tags.forEach(tag => node.tags.add(tag));
  node.type = 'note';
  return node;
}

//TODO review addalphanumeric control
//position help track multiple links to the same target.
//from joplin.link.graph
function parseNoteLinks(joplinNote: any) : Link[] {
  let position = 1;
  const links = [];
  // TODO: needs to handle resource links vs note links. see 4. Tips note for
  // webclipper screenshot.
  // https://stackoverflow.com/questions/37462126/regex-match-markdown-link
  const linkRegexp = /\[\]|\[.*?\]\(:\/(.*?)\)/g;
  var match = linkRegexp.exec(joplinNote.body);
  while (match != null) {
    if (match[1] !== undefined) {
      const target = match[1];
      const link = new Link(joplinNote.id, target);
      link.type = 'reference';
      link.position = position;
      links.push(link);
      position++;
    }
    match = linkRegexp.exec(joplinNote.body);
  }
  return links;
}
