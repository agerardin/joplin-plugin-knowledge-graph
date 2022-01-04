import { unified } from 'unified'
import remarkParse from 'remark-parse'
import extractNoteLink from './extract-note-link'
import Note from './note'

const parser = unified().use(remarkParse)

export function parseNoteBody(body : string, note: Note) {

    //create the AST
    const tree = parser.parse(body);

    // run plugins
    unified()
        .use(extractNoteLink, note)
        .run(tree);

    return note;
}