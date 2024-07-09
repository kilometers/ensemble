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
}
