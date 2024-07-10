namespace ensemble {
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
    //% block="trigger MIDI event $input"
    //% group="MIDI"
    export function triggerMIDIEvents(buffer: Buffer) {
        // Midi message has at least 3 bytes
        // and is a multiple of 3 bytes
        if (buffer.length > 2 && buffer.length % 3 === 0) {
            for (let i = 0; i < buffer.length; i += 3) {
                let command = buffer[i];
                let note = buffer[i + 1];
                let velocity = buffer[i + 2];
                let commandType = command >> 4;

                let clampedNote = Math.max(0, Math.min(note - lowestNoteForNoteDisplay, 24));

                if (commandType === MidiCommand.NoteOn) {
                    globalNoteOnHandler(note, velocity);
                    activateNoteLed(clampedNote, velocity);
                } else if (commandType === MidiCommand.NoteOff) {
                    globalNoteOffHandler(note, velocity);
                    activateNoteLed(clampedNote, velocity);
                }
            }
        }
    }
}
