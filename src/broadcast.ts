namespace ensemble {
    let broadcastQueue: BroadcastMessage[] = [];
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
        let experimentalBuffersToSend: number[][] = [];
        let count = 0;
        while (count < broadcastQueueMaxCutoff && broadcastQueue.length > 0) {
            let message = broadcastQueue.shift();
            if (message.type == "note") {
                const firstData = broadcastQueue.shift();
                const secondData = broadcastQueue.shift();
                if (firstData
                    && secondData
                    && firstData.type == "data"
                    && secondData.type == "data"
                    && firstData.group == message.group
                    && secondData.group == message.group)
                {
                    if (!experimentalBuffersToSend[message.group]) {
                        experimentalBuffersToSend[message.group] = [];
                    }
                    experimentalBuffersToSend[message.group].push(message.byte);
                    experimentalBuffersToSend[message.group].push(firstData.byte);
                    experimentalBuffersToSend[message.group].push(secondData.byte);
                }
            }
            experimentalBuffersToSend.forEach((val, key) => {
                const bufferToSend = pins.createBufferFromArray(experimentalBuffersToSend[key]);
                radio.setGroup(key);
                radio.sendBuffer(bufferToSend);
            });

            count++;
        }
        
        radio.setGroup(channel);
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
                }
                
                else if (byte >> 4 === 0x8 || byte >> 4 === 0x9) { // Note off or on
                    lastMIDIChannel = byte & 0x0F;
                    queueBroadcastMessage({
                        group: cb * 16 + lastMIDIChannel + 1,
                        type: "note",
                        byte
                    });
                }
            }
            else {             // Data byte
                queueBroadcastMessage({
                    group: cb * 16 + lastMIDIChannel + 1,
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