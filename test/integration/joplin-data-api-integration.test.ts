import axios from 'axios';

describe("Joplin Data API - Events", () => {
    // [see](https://joplinapp.org/api/references/rest_api/#events)
    it("return all change events for notes recorded in the db (kept for 90 days)", async () => {
        const host = process.env.HOST, port = process.env.PORT, token = process.env.TOKEN;
        const path = 'events';
        let cursor = '0';
        const query = `http://${host}:${port}/${path}?cursor=${cursor}&token=${token}`
        console.log(query);
        const updates = []; 
        let response = null;
        do {
            response = await axios.get(query);
            updates.push(...response.data.items);
            cursor = response.data.cursor;
        }
        while(response.data.has_more);

        console.log(response.data.items);
        console.log(cursor);
        console.log(`${updates.length} changes recorded`);
    });

    it("return last cursor", async () => {
        const host = process.env.HOST, port = process.env.PORT, token = process.env.TOKEN;
        const path = 'events';
        const query = `http://${host}:${port}/${path}?token=${token}`
        console.log(query);
        const response = await axios.get(query);
        expect(response.data.items.length).toEqual(0);
        expect(response.data.cursor).not.toEqual(0);
    });

    
});