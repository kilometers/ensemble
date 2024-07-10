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
    //% block="be a Musician"
    //% group="Roles"
    export function setRoleToMusician() {
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
        broadcastMessages();
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