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
        let buffersToSend: Map<number, number[]> = new Map();
        let count = 0;
        while (count < broadcastQueueMaxCutoff && broadcastQueue.length > 0) {
            let message = broadcastQueue.shift();
            if (message.type == "note") {
                const [firstData, secondData] = broadcastQueue.splice(0, 2);
                if (firstData
                    && secondData
                    && firstData.type == "data"
                    && secondData.type == "data"
                    && firstData.group == message.group
                    && secondData.group == message.group)
                {
                    let buffer = buffersToSend.get(message.group);
                    if (!buffer) {
                        buffer = [];
                    }
                    buffer.push(message.byte);
                    buffer.push(firstData.byte);
                    buffer.push(secondData.byte);
                    buffersToSend.set(message.group, buffer);
                }
            }
            buffersToSend.forEach((value, key) => {
                const buffer = pins.createBufferFromArray(value);
                radio.setGroup(key);
                radio.sendBuffer(buffer);
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
    //% block="broadcast MIDI $input to $cb"
    //% group="MIDI"
    export function broadcastMidiToBand(input: string, cb: ChannelBand) {
        let byte = +input;

        if (byte < 240) {                     // Midi command
            if (dataCount > 0) {
                queueBroadcastMessage({
                    group: cb * 16 + lastMIDIChannel,
                    type: "data",
                    byte
                });
                dataCount--;
            } else {
                lastMIDICommand = (byte >> 4) & 0x0F;
                lastMIDIChannel = byte & 0x0F;
                queueBroadcastMessage({
                    group: cb * 16 + lastMIDIChannel,
                    type: "note",
                    byte
                });
                dataCount = 2;
            } 

        } else if (byte > 248) {             // System message
            lastMIDICommand = byte;
            lastMIDIChannel = Channel.System;
            radio.setGroup(Channel.System);
            radio.sendNumber(byte);
        } else if (byte == 248) {     // Midi Clock
            // ...
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