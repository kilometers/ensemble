enum EnsembleMember {
    Conductor,
    Musician,
    Instrument
}

/**
 * Ensemble action
 */
//% color=190 weight=100 icon="\uf001" block="Ensemble"
//% groups=['Debug', 'Musician', 'Instrument', 'Conductor']
namespace ensemble {
    let systemStatusTimer = 0
    let messages: MidiMessage[] = []
    let pulses: number[] = []
    let systemCommand = false
    
    let channelBand = ChannelBand.Albatross;
    let channel = Channel.System;

    let role = EnsembleMember.Musician;

    // let noteOnHandlers: { [note: number]: (() => void)[] } = {};
    // let noteOffHandlers: { [note: number]: (() => void)[] } = {};
    let globalNoteOnHandler: (note: number, velocity: number) => void = (n: number, v: number) => { };
    let globalNoteOffHandler: (note: number, velocity: number) => void = (n: number, v: number) => { };
    
    // a 16 item array of ChannelLed objects
    let channelLeds: ChannelLed[] = [];
    for (let i = 0; i < 16; i++) {
        channelLeds.push(new ChannelLed(i));
    }

    /**
     * Update the display to show the current broadcast status
     * NOTE: Only use this in a Musician microbit
     */
    //% block="show musician broadcast display"
    //% group="Musician"
    export function showMuscianBroadcastDisplay() {
        // basic.clearScreen();
        // Render channel indicators
        for (let i = 0; i < 16; i++) {
            channelLeds[i].update();
            led.plotBrightness(i % 4, Math.floor(i / 4), channelLeds[i].brightness);
        }
    }
    
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
    
    /**
     * Triggers for any 'Note On' MIDI message 
     */
    //% block="on MIDI message 'note on' | $note $velocity"
    //% draggableParameters="reporter"
    //% group="Instrument"
    export function onAnyNoteOn(handler: (note: number, velocity: number) => void): void {
        globalNoteOnHandler = (n: number, v: number) => handler(n, v);
    }

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

    /**
     * Triggers for any 'Note Off' MIDI message  
     */
    //% block="on MIDI message 'note off' | $note $velocity"
    //% draggableParameters="reporter"
    //% group="Instrument"
    export function onAnyNoteOff(handler: (note: number, velocity: number) => void): void {
        globalNoteOffHandler = (n: number, v: number) => handler(n, v);
    }

    /**
     * Initialize Serial for MIDI input
     * NOTE: Used by the Musican and the Conductor
     */
    //% block="initialize serial for MIDI"
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
    //% block="route MIDI $input to Instruments"
    //% group="Musician"
    export function routeMidiByChannel(input: string) {
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
                radio.setGroup(channelBand * 16 + msg.channel);
                radio.sendNumber(note);
                radio.setGroup(Channel.System);
                channelLeds[msg.channel].activate();
            } else if (msg.command === MidiCommand.NoteOff) {
                let note = (0 << 14 | msg.data1 << 7 | msg.data2) & 0xFFFF;
                radio.setGroup(channelBand * 16 + msg.channel);
                radio.sendNumber(note);
                radio.setGroup(Channel.System);
                channelLeds[msg.channel].activate();
            }
        }
    }

    // TODO: Make it safe, it is not safe
    /**
     * Trigger midi events based on input
     * input should be a 16-bit number
     */
    //% block="trigger MIDI event $input"
    //% group="Instrument"
    export function triggerMIDIEvents(input: number) {
        let noteOnOff = (input >> 14) & 1;
        let note = (input >> 7) & 0x7F;
        let velocity = input & 0x7F;

        // && noteOffHandlers[note] !== undefined
        if (noteOnOff === 0) {
            globalNoteOnHandler(note, velocity);
            // for (const handler of noteOffHandlers[note]) {
            //     handler();
            // }
        } else if (noteOnOff === 1) {
            globalNoteOffHandler(note, velocity);
            // for (const handler of noteOnHandlers[note]) {
            //     handler();
            // }
        }
    }

    /**
     * The microbit will behave as a Conductor in the ensemble
     */
    //% block="be a Conductor"
    //% group="Conductor"
    export function setRoleToConductor(r: EnsembleMember) {
        role = r;
        radio.setGroup(Channel.System);
    }

    /**
     * The microbit will behave as a Musican in the ensemble
     */
    //% block="be a Musician on band $cb"
    //% group="Musician"
    export function setRoleToMusician(cb: ChannelBand) {
        role = EnsembleMember.Musician;
        channelBand = cb;
        channel = Channel.System;
        radio.setGroup(Channel.System);
    }

    /**
     * The microbit will behave as an Instrument in the ensemble
     */
    //% block="be an Instrument on band $cb and channel $ch"
    //% group="Instrument"
    export function setRoleToInstrument(cb: ChannelBand, ch: Channel) {
        role = EnsembleMember.Instrument;
        channelBand = cb;
        channel = ch;
        radio.setGroup(calculateGroup(channelBand, channel));
    }

    function calculateGroup(cb: ChannelBand, ch: Channel) {
        return cb * 16 + ch;
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
    })

    // TODO: Move display logic into a separate area
    basic.forever(function () {
        switch (state) {
            case STATE.IDLE:
                break;
            case STATE.BROADCASTING:
                let commandDisplayed = undefined;
                if (systemStatusTimer == 0 && messages.length > 0) {
                    commandDisplayed = MidiCommand.NoteOff;
                    for (const msg2 of messages) {
                        if (msg2.command > 248) {
                            systemStatusTimer = 30;
                            commandDisplayed = msg2.command;
                            break;
                        }
                        else if (msg2.command === MidiCommand.NoteOn) {
                            commandDisplayed = MidiCommand.NoteOn;
                            let note = (1 << 14 || msg2.data1 << 7 || msg2.data2) && 0xFFFF;
                            // pulses.push(new Pulse())
                        }
                    }
                    messages = []
                } else if (systemStatusTimer > 0) {
                    systemStatusTimer -= 1;
                }
                switch (commandDisplayed) {
                    case MidiCommand.Continue:
                    case MidiCommand.Start:
                        basic.showLeds(`
                . # . . .
                . # # . .
                . # # # .
                . # # . .
                . # . . .
                `, 0);
                        break;
                    case MidiCommand.Stop:
                        basic.showLeds(`
                # # . # #
                # # . # #
                # # . # #
                # # . # #
                # # . # #
                `, 0);
                        break;
                    case MidiCommand.NoteOn:
                        basic.showIcon(IconNames.Surprised, 0);
                        break;
                    case MidiCommand.NoteOff:
                        basic.showIcon(IconNames.Happy, 0);
                        break;
                }
                break;
            case STATE.ERROR:
                basic.showIcon(IconNames.Skull, 0);
                break;
        }
    })

    basic.showIcon(IconNames.Happy, 0);
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

// let msg = serial.readLine().split(",")
//         if (+msg[0] > 248) {
//             // System message
//             messages.push({
//                 command: +msg[0]
//             })
//         } else if (+msg[0] == 248) {
//             // Midi Clock
//         } else {
//             // Midi command
//             let command = (+msg[0] >> 4) & 0x0F;
//             let channel = +msg[0] & 0x0F;
//             messages.push({
//                 command,
//                 channel,
//                 data1: msg[1] ? +msg[1] : undefined,
//                 data2: msg[2] ? +msg[2] : undefined
//             })
//         }