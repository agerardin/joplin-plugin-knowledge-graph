const totalPages = 2;

let idNoteA = 'ccc282ab903f4faab703368e55bf14f7'
let idNoteB = '9c4be24807014ff89d289602f502dda0'
let idNoteC = 'c0edf1bfeec446b098ce53952c5f6419'
let idNoteD = '5d87d84a1ae04936abf0daa0d238dd52'
let idNoteE = 'c67747907f514c4e91f3236722a3da2b'

const page1 = {
    items: [
        {
            "id": `${idNoteA}`,
            "parent_id": "07cf68b30f0a4305a6c68d3441e705db",
            "title": "Note A",
            "body": `[link to note B](:/${idNoteB}) and ` +
                    `[link to note C](:/${idNoteC}) and` +
                    `[link to missing note](:/dsadsdas)`
        },
        {
            "id": `${idNoteB}`,
            "parent_id": "07cf68b30f0a4305a6c68d3441e705db",
            "title": "Note B",
            "body": `[link to note D](:/${idNoteD}) and ` +
                    `[link to note C](:/${idNoteC})`
        },
        {
            "id": `${idNoteC}`,
            "parent_id": "07cf68b30f0a4305a6c68d3441e705db",
            "title": "Note C"
        }],
    has_more: true
};

const page2 = {
    items: [
        {
            "id": `${idNoteD}`,
            "parent_id": "e218807473514008a7f0ec8ad4814e6e",
            "title": "Note D",
            "body": `[link to note E](:/${idNoteE})`
        },
        {
            "id": `${idNoteE}`,
            "parent_id": "e218807473514008a7f0ec8ad4814e6e",
            "title": "Note E"
        }],
    has_more: false
};



export default {
    data: {
        get: async (path: Array<any>, query: any): Promise<any> => {

            if(path[0] !== 'notes'){
                return;
            }
            
            //Responds notes/:id
            if(path[1]) {
                if(path[1] == `${idNoteA}`){
                    return page1.items[0];
                }
                if(path[1] == `${idNoteB}`){
                    return page1.items[1];
                }
                if(path[1] == `${idNoteC}`){
                    return page1.items[2];
                }
                if(path[1] == `${idNoteD}`){
                    return page2.items[0];
                }
                if(path[1] == `${idNoteE}`){
                    return page2.items[1];
                }
            }

            if(query.page == 1) {
                return page1;
            }
            else if(query.page == 2) {
                return page2;
            }
            else {
                //TODO that should be the expected result
                throw new Error(`no note with id ${path[1]}`)
            }
        }
    }
};