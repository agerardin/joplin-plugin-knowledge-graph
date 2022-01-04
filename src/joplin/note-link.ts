/**
 * May eventually merge with Link.
 * For now it gives us the freedom to evolve each model 
 * separately.
 */
export default interface NoteLink {
    noteId: string
    elementId?: string
    type?: string
    label?: string
    position?: {start: number, end:number}
}