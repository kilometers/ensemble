enum EnsembleMember {
    Conductor,
    Musician,
    Instrument
}

/**
 * Ensemble action
 */
//% color=190 weight=100 icon="\uf001" block="Ensemble"
//% groups=['Roles', 'Display', 'MIDI']
namespace ensemble {
    let systemStatusTimer = 0;
    let messages: MidiMessage[] = [];
    let pulses: number[] = [];
    let systemCommand = false;

    let role = EnsembleMember.Musician;

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

    /**
     * Initialize Serial for MIDI input
     * NOTE: Used by the Musican and the Conductor
     */
    //% block="initialize serial for MIDI"
    //% group="MIDI"
    export function initSerialForMidi(): void {
        serial.setTxBufferSize(64)
        serial.setRxBufferSize(64)
        serial.setBaudRate(BaudRate.BaudRate115200)
        serial.redirectToUSB()
    }

    // TODO: Go back to using normal midi format?
    /**
     * Capture midi and route it to the appropriate channels over radio
     * NOTE: Only use this in a Musician microbit
     */
    //% block="send MIDI $input to $cb"
    //% group="MIDI"
    export function broadcastMidiToBand(input: string, cb: ChannelBand) {
        let parsed = input.split(",");
        if (+parsed[0] > 248) {             // System message
            radio.setGroup(Channel.System);
            radio.sendNumber(+parsed[0]);
        } else if (+parsed[0] == 248) {     // Midi Clock
            //...
        } else if (parsed.length > 1) {     // Midi command
            let command = (+parsed[0] >> 4) & 0x0F;
            let channel = (+parsed[0] & 0x0F);

            const msg: MidiMessage = {
                command,
                channel,
                data1: +parsed[1],
                data2: +parsed[2]
            }

            if (msg.command === MidiCommand.NoteOn) {
                let note = (1 << 14 | msg.data1 << 7 | msg.data2) & 0xFFFF;
                radio.setGroup(cb * 16 + msg.channel);
                radio.sendNumber(note);
                radio.setGroup(Channel.System);
                activateChannelLed(msg.channel, msg.data2);
            } else if (msg.command === MidiCommand.NoteOff) {
                let note = (0 << 14 | msg.data1 << 7 | msg.data2) & 0xFFFF;
                radio.setGroup(cb * 16 + msg.channel);
                radio.sendNumber(note);
                radio.setGroup(Channel.System);
                activateChannelLed(msg.channel, msg.data2);
            }
        }
    }

    // TODO: Make it safe, it is not safe
    // TODO: Go back to using normal midi format?
    /**
     * Trigger midi events based on input
     * input should be a 16-bit number
     */
    //% block="trigger MIDI event $input"
    //% group="MIDI"
    export function triggerMIDIEvents(input: number) {
        let noteOnOff = (input >> 14) & 1;
        let note = (input >> 7) & 0x7F;
        let velocity = input & 0x7F;
        let clampedNote = Math.max(0, Math.min(note - lowestNoteForNoteDisplay, 24));

        if (noteOnOff === 0) {
            globalNoteOffHandler(note, velocity);
            activateNoteLed(clampedNote, velocity);
        }
        else if (noteOnOff === 1) {
            globalNoteOnHandler(note, velocity);
            activateNoteLed(clampedNote, velocity);
        }
    }

    /**
     * The microbit will behave as a Conductor in the ensemble
     */
    //% block="be a Conductor"
    //% group="Roles"
    export function setRoleToConductor(r: EnsembleMember) {
        role = r;
        radio.setGroup(Channel.System);
    }

    /**
     * The microbit will behave as a Musican in the ensemble
     */
    //% block="be a Musician on band $cb"
    //% group="Roles"
    export function setRoleToMusician(cb: ChannelBand) {
        role = EnsembleMember.Musician;
        channel = Channel.System;
        radio.setGroup(Channel.System);
    }

    /**
     * The microbit will behave as an Instrument in the ensemble
     */
    //% block="be an Instrument on band $cb and channel $ch"
    //% group="Roles"
    export function setRoleToInstrument(cb: ChannelBand, ch: Channel) {
        role = EnsembleMember.Instrument;
        channelBand = cb;
        channel = ch;
        radio.setGroup(calculateGroup(channelBand, channel));
    }

    function calculateGroup(cb: ChannelBand, ch: Channel) {
        return cb * 16 + ch;
    }

    /*
     * Convert a 24-bit number to a MidiMessage
     * @param input 24-bit number
     */
    function parseMidiMessage(input: number): MidiMessage {

        let command = (input >> 16) & 0xFF;
        let data1 = (input >> 8) & 0xFF;
        let data2 = input & 0xFF;

        if (command > 248) {
            return {
                command
            }
        }

        // Midi Clock, be careful with this
        // if (command === 248) {
        //     // ...
        // }

        return {
            command: command >> 4 & 0x0F,
            channel: command & 0x0F,
            data1,
            data2
        }
    }

    basic.forever(() => {
        switch (role) {
            case EnsembleMember.Musician:
                messages.forEach(msg => {
                    if (msg.command === MidiCommand.NoteOn) {
                        let note = (1 << 14 || msg.data1 << 7 || msg.data2) && 0xFFFF;
                        radio.setGroup(channelBand * 16 + msg.channel);
                        radio.sendNumber(note);
                        radio.setGroup(Channel.System);
                    } else if (msg.command === MidiCommand.NoteOff) {
                        let note = (0 << 14 || msg.data1 << 7 || msg.data2) && 0xFFFF;
                        radio.setGroup(channelBand * 16 + msg.channel);
                        radio.sendNumber(note);
                        radio.setGroup(Channel.System);
                    }
                });
                break;
        }
    });
}

enum STATE {
    IDLE,
    BROADCASTING,
    ERROR
}
let state: STATE = STATE.IDLE;


class Pulse {
    pin: DigitalPin
    start: number
    duration: number

    constructor(pin: DigitalPin, duration?: number) {
        this.pin = pin;
        this.start = input.runningTime();
        this.duration = duration | 40;
    }
}