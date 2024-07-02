serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    // add midi messages from (read newline) to [messages]
    msg = serial.readLine().split(",")
    if (+msg[0] > 248) {
        messages.push({
            command: +msg[0]
        })
    } else if (+msg[0] == 248) {
        brightness = 255
    } else {
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
let brightness = 0
let systemStatusTimer = 0
let messages: MidiMessage[] = []
let pulses: number[] = []
let systemCommand = false
let msg: string[] = []
namespace ensemble {
    enum ChannelBand {
        Albatross = 1,
        Bananaquit = 2,
        Cassowary = 3,
        Doterrel = 4,
        Emu = 5,
        Finch = 6,
        Gargeney = 7,
        Hoatzin = 8,
        Idisbill = 9,
        Killdeer = 10,
        Lyrebird = 11,
        Martin = 12,
        Nightingale = 13,
        Osprey = 14,
        Partridge = 15,
        // Quetzal=16
    }

    /**
     * On MIDI Note On
     */
    //% block="on note $note on"
    //% note.min=35 note.max=127 note.defl=35 
    export function onNoteOn(note: number, handler: () => void): void {
        handler();
    }

     /**
     * On MIDI Note Off
     */
    //% block="on note $note off"
    //% note.min=35 note.max=127 note.defl=35 
    export function onNoteOff(note: number, handler: () => void): void {
        handler();
    }

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
brightness = 100
let commandDisplayed: MidiCommand
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
serial.setTxBufferSize(64)
serial.setRxBufferSize(64)
serial.setBaudRate(BaudRate.BaudRate115200)
serial.redirectToUSB()
basic.showIcon(IconNames.Happy, 0);
basic.forever(function () {
    switch (state) {
        case STATE.IDLE:
            break;
        case STATE.TRANSMITTING:
            commandDisplayed = undefined;
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

                        radio.sendNumber(note)
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
