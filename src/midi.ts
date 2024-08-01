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

    export enum MicroMidiProtocol {
        //% block="MICRO:MIDI"
        // bit 7 is the note on / off flag (1 or 0)
        // bits 6-3 are the note (0-15)
        // bits 2-0 are the velocity (0-7)
        MICRO_MIDI,
        //% block="MIDI"
        MIDI
    }

    export let globalNoteOnHandler: (note: number, velocity: number) => void = (n: number, v: number) => { };
    export let globalNoteOffHandler: (note: number, velocity: number) => void = (n: number, v: number) => { };
    
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
    //% block="trigger $protocol events from $buffer"
    //% group="MIDI"
    export function triggerMIDIEvents(protocol: MicroMidiProtocol, buffer: Buffer) {
        for (let i = 0; i < buffer.length; i++) {
            let byte = buffer[i];

            switch(protocol) {
                case MicroMidiProtocol.MIDI:
                    handleMidiByte(byte, 
                        (byte) => {
                            // System message
                        }, 
                        (byte) => {
                            // Note message
                            hangingBuffer = [byte];
                        },
                        (byte) => {
                            // Data message
                            if(hangingBuffer.length > 0) {
                                hangingBuffer.push(byte);
                            }
                        })
                    
                        // If we have a full message, process and trigger the handler
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
                    break;
                case MicroMidiProtocol.MICRO_MIDI:
                    const noteFlag = byte >> 7;
                    const note = byte >> 3 & 0x0F;
                    const velocity = byte & 0x07;

                    if (noteFlag === 1) {
                        globalNoteOnHandler(note, velocity);
                        activateNoteLed(note, velocity);
                    }
                    else {
                        globalNoteOffHandler(note, velocity);
                        activateNoteLed(note, velocity);
                    }
                    break;
            }

        }
    }

    /**
     * Trigger simple events
     * These are simplified, one byte messages with just a pitch and velocity
     * The 4 MSB are pitch, the 4 LSB are velocity
     */
    //% block="trigger simple event $buffer"
    //% group="MIDI"
    export function triggerSimpleEvents(buffer: Buffer) {
        for (let i = 0; i < buffer.length; i++) {
            let byte = buffer[i];
            let note = (byte >> 4) + 35;
            let velocity = byte & 0x0F;
            let clampedNote = Math.max(0, Math.min(note - lowestNoteForNoteDisplay, 24));

            globalNoteOnHandler(note, velocity);
            activateNoteLed(clampedNote, velocity);
        }
    }

    export function handleMidiByte(
        byte: number,
        systemHandler: (byte: number) => void,
        noteHandler: (byte: number) => void,
        dataHandler: (byte: number) => void)
    {
        if ((byte >> 7) && 0x01 === 1) { // Status byte
            if (byte >> 4 === 0xF) { // System message
                systemHandler(byte);
            }
            
            else if (byte >> 4 === 0x8 || byte >> 4 === 0x9) { // Note off or on
                noteHandler(byte);
            }
        }
        else { // Data byte
            dataHandler(byte);
        }
    }
}
