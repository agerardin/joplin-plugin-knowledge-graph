import { parseNoteBody } from './mkdown-parser';
import Note from './note';

describe("parse note", () => {

    let note : Note;

    beforeEach(() => {
        note = {
            id: 'context_note_id',
            title: '',
            links: [],
            body: ''
        };
    });

    it("parse a fully described note link", async () => {
        const body = `
[link_label](:/note_id#element_id "link_type")
        `
        parseNoteBody(body, note);
        expect(note.links.length).toEqual(1);
        const link = note.links[0];
        expect(link.noteId).toEqual('note_id');
        expect(link.elementId).toEqual('element_id');
        expect(link.type).toEqual('link_type');
        expect(link.label).toEqual('link_label');
    })

    it("parse note link", async () => {
        const body = `
[link_label](:/note_id)
        `
        parseNoteBody(body, note);
        expect(note.links.length).toEqual(1);
        const link = note.links[0];
        expect(link.noteId).toEqual('note_id');
        expect(link.label).toEqual('link_label');
    })

    it("parse note link without a label", async () => {
        const body = `
[](:/note_id)
        `
        parseNoteBody(body, note);
        expect(note.links.length).toEqual(1);
        const link = note.links[0];
        expect(link.noteId).toEqual('note_id');
    })

    it("ignore note link within code section", async () => {
        const body = `
    [link_label](:/note_id)
        `
        parseNoteBody(body, note);
        expect(note.links.length).toEqual(0);
    })

    it("does not parse external link", async () => {
        const body = `
    [external_link](http://url)
        `
        parseNoteBody(body, note);
        expect(note.links.length).toEqual(0);
    })

    it("parse implicit self reference to a heading in the same document", async () => {
        const body = `[link_label](#element_id)`
        parseNoteBody(body, note);
        expect(note.links.length).toEqual(1);
        const link = note.links[0];
        expect(link.noteId).toEqual('context_note_id');
        expect(link.elementId).toEqual('element_id');
        expect(link.label).toEqual('link_label');
    })

    
});
