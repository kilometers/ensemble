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
        type: "n" | "s" | "d" | "mm";
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

    /**
     * Capture midi as a string and route it to the appropriate channels over radio
     * NOTE: Use with serial.readString() to capture midi from a serial connection
     */
    //% block="broadcast MIDI $raw to $cb"
    //% group="MIDI"
    export function broadcastMidiToBand(raw: string, cb: ChannelBand, protocol: MicroMidiProtocol = MicroMidiProtocol.C) {
        if (raw.length == 0) return;
        
        let buffer = Buffer.fromUTF8(raw);

        // Sort the buffer into midi messages
        for (let i = 0; i < buffer.length; i++) {
            let byte = buffer[i];
            let message: BroadcastMessage;

            if ((byte >> 7) && 0x01 === 1) { // Status byte
                if (byte >> 4 === 0xF) { // System message
                    lastMIDIChannel = Channel.System;
                }
                
                else if (byte >> 4 === 0x8 || byte >> 4 === 0x9) { // Note off or on
                    lastMIDIChannel = byte & 0x0F;

                    message = {
                        group: cb * 16 + lastMIDIChannel,
                        type: "n",
                        byte
                    }
                }
            }
            else { // Data byte
                message ={
                    group: cb * 16 + lastMIDIChannel,
                    type: "d",
                    byte
                };
            }
            switch (protocol) {
                case MicroMidiProtocol.MIDI:
                    if (message)
                        queueBroadcastMessage(message);
                    break;
                case MicroMidiProtocol.MICRO_MIDI:
                    if (message) {
                        if(message.type === "n") {
                            hangingBuffer = [];
                            hangingBuffer.push(message.byte);
                        } else if (message.type === "d") {
                            if(hangingBuffer.length > 0) {
                                hangingBuffer.push(message.byte);
                            }
                        }
                    }
                    if (hangingBuffer.length === 3) {
                        const command = hangingBuffer[0] >> 4;
                        // Note flag lives in bit 7, can be on (1) or off (0)
                        const noteFlag = command === 0x8 ? 0 : 1;
                        const note = hangingBuffer[1] - 35;
                        // Scale velocity from 0-127 to 0-7
                        const velocity = Math.floor(hangingBuffer[2] / 18);

                        // If the note or velocity are out of bounds, clear the buffer
                        if (note < 0 || note > 15 || velocity < 0 || velocity > 7) {
                            hangingBuffer = [];
                            return;
                        }

                        queueBroadcastMessage({
                            group: cb * 16 + (hangingBuffer[0] & 0x0F),
                            type: "mm",
                            // bit 7 is the note on / off flag (1 or 0)
                            // bits 6-3 are the note (0-15)
                            // bits 2-0 are the velocity (0-7)
                            byte: ((noteFlag << 7) & 0x80) | ((note << 3) & 0x78) | (velocity & 0x07)
                        });
                        hangingBuffer = [];
                    }
                    else if (hangingBuffer.length > 3) {
                        hangingBuffer = [];
                    }
            }
        }
    }


    let hangingBuffer: number[] = [];
    /**
     * Broadcast micro:midi events
     * These are simplified, one byte messages
     * bit 7 is the note on / off flag
     * bits 5 and 4 are the channel
     * bits 3 to 0 are the note
     */
    //% block="broadcast  event $buffer to $cb"
    //% group="MIDI"
    export function broadcastMicroMidiToBand(buffer: Buffer, cb: ChannelBand, protocol: MicroMidiProtocol = MicroMidiProtocol.MICRO_MIDI) {
        for (let i = 0; i < buffer.length; i++) {
            handleMidiByte(buffer[i], 
                (byte) => { // System message
                    // ...
                }, 
                (byte) => { // Note off or on
                },
                (byte) => { // Data byte
                    if(hangingBuffer.length > 0) {
                        hangingBuffer.push(byte);
                    }
                })
            if (hangingBuffer.length === 3) {
                
            }
            else if (hangingBuffer.length > 3) {
                hangingBuffer = [];
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


