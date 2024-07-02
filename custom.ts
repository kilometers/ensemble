namespace ensemble {
    // Initilization flags
    let listeningToSerial = false;
    let updatingDisplay = false;

    let systemStatusTimer = 0
    let messages: MidiMessage[] = []
    let pulses: number[] = []
    let systemCommand = false
    let msg: string[] = []

    enum ChannelBand {
        Albatross,
        Bananaquit,
        Cassowary,
        Doterrel,
        Emu,
        Finch,
        Gargeney,
        Hoatzin,
        Idisbill,
        Killdeer,
        Lyrebird,
        Martin,
        Nightingale,
        Osprey,
        Partridge,
        // Quetzal=16
    }

    let channelBand = ChannelBand.Albatross;

    /**
     * Set the 16-channel radio band to broadcast MIDI messages on
     */
    //% block="set channel band to $cb"
    //% cb.defl=ChannelBand.Albatross
    export function setChannelBand(cb: ChannelBand): void {
        channelBand = cb;
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
     * Set the MIDI source to USB or Serial TX
     */
    //% block="set midi source"
    export function setMidiSource(): void {
        if (listeningToSerial) {
            return;
        }

        listeningToSerial = true;

        serial.setTxBufferSize(64)
        serial.setRxBufferSize(64)
        serial.setBaudRate(BaudRate.BaudRate115200)
        serial.redirectToUSB()
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            // add midi messages from (read newline) to [messages]
            msg = serial.readLine().split(",")
            if (+msg[0] > 248) {
                // System message
                messages.push({
                    command: +msg[0]
                })
            } else if (+msg[0] == 248) {
                // Midi Clock
            } else {
                // Midi command
                let command = (+msg[0] >> 4) & 0x0F;
                let channel = +msg[0] & 0x0F;
                messages.push({
                    command,
                    channel,
                    data1: msg[1] ? +msg[1] : undefined,
                    data2: msg[2] ? +msg[2] : undefined
                })
            }
        })
    }

    /**
     * Begin updating the microbit display according to Ensemble's activity
     */
    //% block="start updating the display"
    export function startUpdatingDisplay() {
        if (updatingDisplay) {
            return
        }
        
        updatingDisplay = true;
        basic.forever(function () {
            switch (state) {
                case STATE.IDLE:
                    break;
                case STATE.TRANSMITTING:
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
                                // let note = (1 << 7 || msg.data1) && 0xFF
                                let note = (1 << 14 || msg2.data1 << 7 || msg2.data2) && 0xFFFF;
                                
                                radio.setGroup(channelBand * 16 + msg2.channel)
                                radio.sendNumber(note)
                                radio.setGroup(0)
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
    }

    basic.showIcon(IconNames.Happy, 0);
}

enum STATE {
    IDLE,
    TRANSMITTING,
    ERROR
}
let state: STATE = STATE.TRANSMITTING;
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