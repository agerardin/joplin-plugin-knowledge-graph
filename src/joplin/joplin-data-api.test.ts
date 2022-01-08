import JoplinDataApi from "./joplin-data-api";

describe("Joplin Data API", () => {

    const query = {
        fields: ["id", "parent_id", "title", "body"],
        order_dir: "DESC",
        limit: 10

      };

    it("return all notes", async () => {
        let api = JoplinDataApi.instance();
        let {results, truncated} = await api.getNotes(query, 10);
        expect(results.length).toBe(5);
        expect(truncated).toBe(false);
    })

    it("return all notes up to maxNotes cutoff", async () => {
        let api = JoplinDataApi.instance();
        let {results, truncated} = await api.getNotes(query, 4);
        expect(results.length).toBe(4);
        expect(truncated).toBe(true);
    })

    it("return one note by id", async () => {
        let api = JoplinDataApi.instance();
        let {results} = await api.getNotesByIds(query, ['ccc282ab903f4faab703368e55bf14f7'] , 10);
        expect(results.length).toBe(1);
    })

    it("fetch a note that does exists", async () => {
        let api = JoplinDataApi.instance();
        let {idsNotFound} = await api.getNotesByIds(query, ['does_not_exists'] , 10);
        expect(idsNotFound.length).toBe(1);
        expect(idsNotFound[0]).toEqual('does_not_exists')
    })

    it("return two notes by id", async () => {
        let api = JoplinDataApi.instance();
        let {results} = await api.getNotesByIds(query, ['ccc282ab903f4faab703368e55bf14f7', '9c4be24807014ff89d289602f502dda0'] , 10);
        expect(results.length).toBe(2);
    })
    
});

