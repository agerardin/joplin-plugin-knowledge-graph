import joplin from 'api';
import Note, { parseJoplinNote } from "./note";

export interface QueryParams {
    fields?: Array<string>,
    order_dir?: string
    limit?: string
}

export interface NoteQueryResults {
    results: Array<Note>,
    idsNotFound?: Array<string>,
    truncated?: boolean
}

export default class JoplinDataApi {

    private static api_ : JoplinDataApi;

    static instance() : JoplinDataApi {
        if(!this.api_) {
            this.api_ = new JoplinDataApi();
        }
        return this.api_;
    }

    //queryParams follows joplin query format so we just need to return it.
    public buildQueryParams(queryParams : QueryParams) : any {
        return queryParams;
    }

    public getSelectedNote() : any {
        return joplin.workspace.selectedNote();
    }

    public getSelectedNoteIds() : Promise<Array<string>> {
        return joplin.workspace.selectedNoteIds();
    }

    /**
     * Get notes satisfying the query.
     * @param query : customize what data is retrieved.
     * @param pageSize : number of notes returned in one subquery.
     * @param max : max number of notes.
     * @returns a tuple : (notes : Map<string, Note>, truncated : boolean)
     * notes : all notes satisfying the query up to maxNote
     * truncated : true if we had to apply a cutoff
     */
    public async getNotes(query: any, max: number = Number.MAX_SAFE_INTEGER) : Promise<NoteQueryResults> {
        
        let joplinNotes = [];
        let page : any;
        let pageNum = 1;
        let isLimitReached = () => joplinNotes.length > max;
        let truncated = false;

        do {
          query.page = pageNum;

          try {
            page = await joplin.data.get(['notes'], query);
          } catch(error) {
            console.error(error);
            return { results: [], truncated:true };
          } 

          joplinNotes.push(...page.items);
          pageNum++;

          if(isLimitReached()) {
              truncated = true;
            break;
         }

        } while (page.has_more)

        if(isLimitReached()) {
            console.warn(`Max number of notes reached: ${max}. ` + 
            `Some notes may not be visible.`);
            joplinNotes = joplinNotes.slice(0,max);
        }

        const notes = await Promise.all(joplinNotes.map( async (note) => this.buildNote(note)));

        return { results: notes, truncated: truncated };
    }

    /**
     * Get all notes with given ids.
     * This method can get slow if we have to process a large number of ids since the api authorized only query by id at the time.
     * TODO best would be to add method to get batch of ids to [JoplinDataAPI](https://joplinapp.org/api/references/rest_api/).
     * @param ids list of note ids.
     * @param maxConcurrentRequests max number of concurrent requests to the joplin API. Can we useful we requesting large number of notes.
     * @returns list of notes.
     */
    public async getNotesByIds(query : any, ids: string[], maxConcurrentRequests: number = 10) : Promise<NoteQueryResults> {

        const joplinNotes = [];
        const idsNotFound = [];
        
        let promises : Promise<any>[];
        let requests : string[];
        let start : number, end: number, chunk : number = maxConcurrentRequests;
        
        for (start = 0, end = ids.length; start < end; start += chunk) {
            requests = ids.slice(start, start + chunk);
            promises = requests.map( id =>
                this.getNote(query, id)
              );

            const results = await Promise.all(promises.map( async (p, index) => {
                return p.catch(e => {
                    idsNotFound.push(requests[index]);
                    return undefined;
                } );
            }));
            const validResults = results.filter(result => !(result == undefined));
            joplinNotes.push(...validResults);  
        }

        if(idsNotFound.length != 0) {
            console.warn(`joplin data api : not found error for : ${idsNotFound}`);           
        }

        const notes = await Promise.all(joplinNotes.map( async (note) => this.buildNote(note)));

        return {results: notes, idsNotFound: idsNotFound, truncated: false};
    }

    public async getNote(query: any, id: string) : Promise<Note> {
        const joplinNote = await joplin.data.get(['notes', id], query);
        return this.buildNote(joplinNote);
    }

    private async buildNote(joplinNote: any) : Promise<Note> {
        const note = parseJoplinNote(joplinNote);
        const tags = await joplin.data.get(['notes', joplinNote.id, 'tags']);
        note.tags = tags?.items ? tags.items.map((tag: any) => tag.title) : [];
        return note;
    }

}
