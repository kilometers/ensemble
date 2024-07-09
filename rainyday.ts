// let noteOnHandlers: { [note: number]: (() => void)[] } = {};
    // let noteOffHandlers: { [note: number]: (() => void)[] } = {};

// /**
    //  * Triggers for a specifc MIDI note when there is a 'Note Off' MIDI message
    //  */
    // //% block="on MIDI note $note 'off'"
    // //% note.min=35 note.max=127 note.defl=35
    // //% group="Instrument"
    // export function onNoteOff(note: number, handler: () => void): void {
    //     if (!noteOffHandlers[note]) {
    //         noteOffHandlers[note] = [];
    //     }
    //     noteOffHandlers[note].push(handler);
// }
    
 // /**
    //  * Triggers for a specifc MIDI note when there is a 'Note On' MIDI message
    //  */
    // //% block="on MIDI note $note 'on'"
    // //% note.min=35 note.max=127 note.defl=35
    // //% group="Instrument"
    // export function onNoteOn(note: number, handler: () => void): void {
    //     if (!noteOnHandlers[note]) {
    //         noteOnHandlers[note] = [];
    //     }
    //     noteOnHandlers[note].push(handler);
// }
    
// && noteOffHandlers[note] !== undefined
// for (const handler of noteOffHandlers[note]) {
            //     handler();
            // }