namespace ensemble {
    let hangingBuffer: number[] = []
    export interface MidiMessage {
        command: MidiCommand
        channel?: Channel
        data1?: number
        data2?: number
    }
    
    export enum MidiCommand {
        Clock = 248,
        Start = 250,
        Continue = 251,
        Stop = 252,
        NoteOn = 9,
        NoteOff = 8
    }

    let globalNoteOnHandler: (note: number, velocity: number) => void = (n: number, v: number) => { };
    let globalNoteOffHandler: (note: number, velocity: number) => void = (n: number, v: number) => { };
    
    /**
     * Triggers for any 'Note On' MIDI message 
     */
    //% block="on MIDI message 'note on' | $note $velocity"
    //% draggableParameters="reporter"
    //% group="MIDI"
    export function onAnyNoteOn(handler: (note: number, velocity: number) => void): void {
        globalNoteOnHandler = (n: number, v: number) => handler(n, v);
    }

    /**
     * Triggers for any 'Note Off' MIDI message  
     */
    //% block="on MIDI message 'note off' | $note $velocity"
    //% draggableParameters="reporter"
    //% group="MIDI"
    export function onAnyNoteOff(handler: (note: number, velocity: number) => void): void {
        globalNoteOffHandler = (n: number, v: number) => handler(n, v);
    }

    // TODO: Make it safe, it is not safe
    // TODO: Go back to using normal midi format?
    /**
     * Trigger midi events based on input
     * input should be a buffer of midi messages (3 bytes each)
     */
    //% block="trigger MIDI event $buffer"
    //% group="MIDI"
    export function triggerMIDIEvents(buffer: Buffer) {
        for (let i = 0; i < buffer.length; i++) {
            let byte = buffer[i];

            if ((byte >> 7) && 0x01 === 1) { // Status byte
                
                if (byte >> 4 === MidiCommand.NoteOn) { // Note on
                    hangingBuffer = [byte];
                } else if (byte >> 4 === MidiCommand.NoteOff) { // Note off
                    hangingBuffer = [byte];
                }
                // else if (byte >> 4 === 0xF) { // System message
                //     
                // }   
            }
            else { // Data byte
                if (hangingBuffer.length > 0) {
                    hangingBuffer.push(byte);
                }
            }

            if (hangingBuffer.length === 3) {
                let command = hangingBuffer[0];
                let note = hangingBuffer[1];
                let velocity = hangingBuffer[2];
                let commandType = command >> 4;

                let clampedNote = Math.max(0, Math.min(note - lowestNoteForNoteDisplay, 24));

                if (commandType === MidiCommand.NoteOn) {
                    globalNoteOnHandler(note, velocity);
                    activateNoteLed(clampedNote, velocity);
                } else if (commandType === MidiCommand.NoteOff) {
                    globalNoteOffHandler(note, velocity);
                    activateNoteLed(clampedNote, velocity);
                }

                hangingBuffer = [];
            } else if (hangingBuffer.length > 3) {
                hangingBuffer = [];
            }

        }
    }
}
