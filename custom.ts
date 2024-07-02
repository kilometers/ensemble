enum ChannelBand {
    Albatross = 0,
    Bananaquit = 1,
    Cassowary = 2,
    Dotterel = 3,
    Emu = 4,
    Finch = 5,
    Garganey = 6,
    Hoatzin = 7,
    Ibisbill = 8,
    Killdeer = 9,
    Lyrebird = 10,
    Martin = 11,
    Nightingale = 12,
    Osprey = 13,
    Partridge = 14
}

enum Channel {
    System = 0,
    Channel_1 = 1,
    Channel_2 = 2,
    Channel_3 = 3,
    Channel_4 = 4,
    Channel_5 = 5,
    Channel_6 = 6,
    Channel_7 = 7,
    Channel_8 = 8,
    Channel_9 = 9,
    Channel_10 = 10,
    Channel_11 = 11,
    Channel_12 = 12,
    Channel_13 = 13,
    Channel_14 = 14,
    Channel_15 = 15,
    Channel_16 = 16
}

enum EnsembleMember {
    Conductor,
    Musician,
    Instrument
}

/**
 * Ensemble action
 */
//% color=190 weight=100 icon="\uf001" block="Ensemble"
namespace ensemble {
    // Initilization flags
    let listeningToSerial = false;
    let updatingDisplay = false;

    let systemStatusTimer = 0
    let messages: MidiMessage[] = []
    let pulses: number[] = []
    let systemCommand = false
    
    let channelBand = ChannelBand.Albatross;
    let channel = Channel.System;

    let role = EnsembleMember.Musician

    /**
    * Set the 16-channel radio band to broadcast MIDI messages
    */
    //% block="set channel band to $cb"
    //% cb.shadow="dropdown"
    export function setChannelBand(cb: ChannelBand): void {
        channelBand = cb;
    }

    /**
    * Set the MIDI channel to listen on
    */
    //% block="set channel to $ch"
    //% ch.shadow="dropdown"
    export function setChannel(ch: Channel): void {
        channel = ch;
    }

    /**
     * On MIDI Note On
     */
    //% block="on MIDI note $note 'on'"
    //% note.min=35 note.max=127 note.defl=35
    export function onNoteOn(note: number, handler: () => void): void {
        handler();
    }

     /**
     * On MIDI Note Off
     */
    //% block="on MIDI note $note 'off'"
    //% note.min=35 note.max=127 note.defl=35
    export function onNoteOff(note: number, handler: () => void): void {
        handler();
    }

    /**
     * Initialize Serial for MIDI input
     */
    //% block="initialize serial for MIDI"
    export function initSerialForMidi(): void {
        serial.setTxBufferSize(64)
        serial.setRxBufferSize(64)
        serial.setBaudRate(BaudRate.BaudRate115200)
        serial.redirectToUSB()
    }

    /**
     * Capture midi and route it to the appropriate channels
     */
    //% block="route midi $input"
    export function routeMidiByChannel(input: string) {
        let parsed = serial.readLine().split(",");
        if (+parsed[0] > 248) {             // System message
            radio.setGroup(Channel.System);
            radio.sendNumber(+parsed[0]);
        } else if (+parsed[0] == 248) {     // Midi Clock
            //...
        } else if (parsed.length > 1) {     // Midi command
            let command = (+parsed[0] >> 4) & 0x0F;
            let channel = +parsed[0] & 0x0F;

            const msg: MidiMessage = {
                command,
                channel,
                data1: +parsed[1],
                data2: +parsed[2]
            }

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
        }
    }

    /**
     * Start broadcasting incoming MIDI messages
     */
    //% block="listen to MIDI messages"
    export function broadcastMidi() {
        state = STATE.BROADCASTING;
    }

    /**
     * The microbit will behave as a Conductor in the ensemble
     */
    //% block="set ensemble role to conductor"
    export function setRoleToConductor(r: EnsembleMember) {
        role = r;
    }

    /**
     * The microbit will behave as a Musican in the ensemble
     */
    //% block="set ensemble role to musician on band $cb"
    export function setRoleToMusician(cb: ChannelBand) {
        role = EnsembleMember.Musician;
        channelBand = cb;
        channel = 0;
    }

    /**
     * The microbit will behave as an Instrument in the ensemble
     */
    //% block="set as an instrument on band $cb and channel $ch"
    export function setRoleToInstrument(cb: ChannelBand, ch: Channel) {
        role = EnsembleMember.Instrument;
        channelBand = cb;
        channel = ch
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
interface MidiMessage {
    command: MidiCommand
    channel?: number
    data1?: number
    data2?: number
}
enum MidiCommand {
    Clock = 248,
    Start = 250,
    Continue = 251,
    Stop = 252,
    NoteOn = 9,
    NoteOff = 8
}

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