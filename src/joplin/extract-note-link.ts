import type {Root, Link, Text} from 'mdast'
import {visit} from 'unist-util-visit'
import NoteLink from './note-link'
import Note from './note'

export default (note : Note) => {

    return (tree : Root) => {

        visit(tree, 'link', (link : Link) => {

            let noteId : string, elementId : string;

            //implicit self references
            if(link.url.startsWith("#")) {
                [noteId, elementId] = [note.id, link.url.substring(1)];
            }

            //note link
            else if(link.url.startsWith(":/")) {
                let url = link.url.substring(2);
                [noteId, elementId] = url.split('#');
            }

            else {
                return;
            }

            let nodeLink : NoteLink = {
                noteId: noteId,
                elementId: elementId,
                type: link.title,
                position: {
                    start: link.position.start.offset,
                    end: link.position.end.offset
                }
            }

            if(link.children.length != 0) {
                nodeLink.label = (link.children[0] as Text).value;
            }
            
            note?.links.push(nodeLink);
        
        });
    } 

}