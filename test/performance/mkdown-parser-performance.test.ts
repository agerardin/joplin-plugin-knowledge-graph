import { parseNoteBody } from "../../src/joplin/mkdown-parser";
import Note, { parseNoteLinks } from "../../src/joplin/note";
import { performance } from "perf_hooks";
import { promises as fs } from "fs";

export function generateNotes(N: number): Array<Note> {
  const notes = [...Array(N).keys()].map((i) => {
    return {
      id: `${i}`,
      title: `note${i}`,
      links: [],
    };
  });
  return notes;
}

async function loadSample(): Promise<string> {
  const data = await fs.readFile(__dirname + "/data/sample.md");
  return data.toString('utf8');
}

describe("benchmark extract note link", () => {
  let note: Note;

  beforeEach(() => {
    note = {
      id: "note_id",
      title: "",
      links: [],
      body: "",
    };
  });

  it("parse using regexp", async () => {
    let sample = await loadSample();

    let startTime = performance.now();
    const nbSamples = 1000;
    note.body = sample;

    startTime = performance.now();
    
    for(let i = 0; i < nbSamples; i++) {
        note.links = parseNoteLinks(note);
      };
    let endTime = performance.now();
    
    console.log(`Took ${endTime - startTime} milliseconds`);

    parseNoteLinks(note);

    console.log(note.links);

    expect(note.links.length).toEqual(2);
  });

  it("parse using parser", async () => {

    const links = [];

    let sample = await loadSample();
    let startTime = performance.now();
    const nbSamples = 1000;
    
    for(let i = 0; i < nbSamples; i++) {
      note = {
        id: "context_note_id",
        title: "",
        links: [],
        body: "",
      };
      note = parseNoteBody(sample, note);
    };

    let endTime = performance.now();

    console.log(`Took ${endTime - startTime} milliseconds`);

    console.log(note.links);

    expect(note.links.length).toEqual(2);
  });
});
