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
            


// Good for converting MIDI to a more simplified format
// Currently calling this protocol micro:midi-c
// The format is as follows:
// bit 7 is the system flag
// bit 6 is the note on / off flag
// bits 5 and 4 are the channel
// bits 3 to 0 are the note
// Here -c stands for channels
// there would also be a micro:midi-v for velocity
// instead of using bits 5 and 4 for the channel, 5 and 4 would be used for the velocity
// also micro:midi-jtn for just the note
// bit 7 is note on or off
// bits 6 to 0 are the note

// export function broadcastMicroMidiToBand(buffer: Buffer, cb: ChannelBand) {
//     for (let i = 0; i < buffer.length; i++) {
//         handleMidiByte(buffer[i], 
//             (byte) => {
//                 // ...
//             }, 
//             (byte) => {
//                 hangingBuffer = [];
//                 hangingBuffer.push(byte);
//             },
//             (byte) => {
//                 if(hangingBuffer.length > 0) {
//                     hangingBuffer.push(byte);
//                 }
//             })
//         if (hangingBuffer.length === 3) {
//             // Note from 0 to 15
//             const note = hangingBuffer[1] - 35;
//             // Velocity from 0 to 16
//             const velocity = Math.floor(hangingBuffer[2] / 7.9375);

//             if (note < 0 || note > 15 || velocity < 0 || velocity > 16) {
//                 hangingBuffer = [];
//                 return;
//             }

//             queueBroadcastMessage({
//                 group: cb * 16 + (hangingBuffer[0] & 0x0F),
//                 type: "simple",
//                 byte: note << 4 | velocity
//             });
//             hangingBuffer = [];
//         }
//         else if (hangingBuffer.length > 3) {
//             hangingBuffer = [];
//         }
//     }
// }

// This is the jts protocol handler
// for (let i = 0; i < buffer.length; i++) {
//     handleMidiByte(buffer[i], 
//         (byte) => { // System message
//             // ...
//         }, 
//         (byte) => { // Note off or on
//             hangingBuffer = [];
//             hangingBuffer.push(byte);
//         },
//         (byte) => { // Data byte
//             if(hangingBuffer.length > 0) {
//                 hangingBuffer.push(byte);
//             }
//         })
//     if (hangingBuffer.length === 3) {
//         const command = hangingBuffer[0] >> 4;
//         const noteFlag = command === 0x8 ? 0 : 1;

//         queueBroadcastMessage({
//             group: cb * 16 + (hangingBuffer[0] & 0x0F),
//             type: "micromidi-c",
//             byte: noteFlag << 7 | hangingBuffer[1] & 0x7F
//         });
//         hangingBuffer = [];
//     }
//     else if (hangingBuffer.length > 3) {
//         hangingBuffer = [];
//     }
// }