namespace ensemble {
    let broadcastQueue: BroadcastMessage[] = [];
    let leftOver: number[] = [];
    const broadcastQueueMaxCutoff = 10;
    export let lastMIDIChannel: Channel;
    export let lastMIDICommand: MidiCommand;
    export let dataCount = 0;
    const buffer = pins.createBuffer(3);
    
    export interface BroadcastMessage {
        group: number;
        type: "note" | "system" | "data";
        byte: number;
    }

    export function queueBroadcastMessage(bm: BroadcastMessage) {
        broadcastQueue.push(bm);
    }

    export function broadcastMessages() {   
        let buffers = generateBufferToSend();

        buffers.forEach((val, key) => {
            if (buffers[key]) {
                const bufferToSend = pins.createBufferFromArray(buffers[key]);
                radio.setGroup(key);
                radio.sendBuffer(bufferToSend);
                activateChannelLed(key, 127);
            }
        });

        radio.setGroup(channel);
    }

    function generateBufferToSend() {
        let experimentalBuffersToSend: number[][] = [];

        while (broadcastQueue.length > 0) {
            let msg = broadcastQueue.shift();
            if (!experimentalBuffersToSend[msg.group])
                experimentalBuffersToSend[msg.group] = []
            experimentalBuffersToSend[msg.group].push(msg.byte)
        }

        return experimentalBuffersToSend
    }

    // TODO: Go back to using normal midi format?
    /**
     * Capture midi and route it to the appropriate channels over radio
     * NOTE: Only use this in a Musician microbit
     */
    //% block="broadcast MIDI to $cb"
    //% group="MIDI"
    export function broadcastMidiToBand(cb: ChannelBand) {
        let raw = serial.readString();
        if (raw.length == 0) return;
        
        let buffer = Buffer.fromUTF8(raw);

        for (let i = 0; i < buffer.length; i++) {
            let byte = buffer[i];

            if ((byte >> 7) && 0x01 === 1) {                     // Status byte
                if (byte >> 4 === 0xF) { // System message
                    lastMIDIChannel = Channel.System;
                }
                
                else if (byte >> 4 === 0x8 || byte >> 4 === 0x9) { // Note off or on
                    lastMIDIChannel = byte & 0x0F;

                    queueBroadcastMessage({
                        group: cb * 16 + lastMIDIChannel,
                        type: "note",
                        byte
                    });
                }
            }
            else {             // Data byte
                queueBroadcastMessage({
                    group: cb * 16 + lastMIDIChannel,
                    type: "data",
                    byte
                });
            }
        }
    }

    /**
     * On radio received buffer
     */
    //% block="on radio received $receivedBuffer"
    //% color="#E3008C"
    //% draggableParameters="reporter"
    //% group="MIDI"
    export function onRadioReceivedBuffer(handler: (receivedBuffer: Buffer) => void): void {
        radio.onReceivedBuffer(handler);
    }
}