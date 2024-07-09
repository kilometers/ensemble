export enum Channel {
    System = 0,
    _1 = 1,
    _2 = 2,
    _3 = 3,
    _4 = 4,
    _5 = 5,
    _6 = 6,
    _7 = 7,
    _8 = 8,
    _9 = 9,
    _10 = 10,
    _11 = 11,
    _12 = 12,
    _13 = 13,
    _14 = 14,
    _15 = 15,
    _16 = 16,
}

export enum ChannelBand {
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

// Given a channel, this class will keep track of the brightness of the corresponding LED
export class ChannelLed {
    channel: Channel;
    brightness: number;
    decay: number;
    minBrightness: number;
    maxBrightness: number;
    state: boolean;

    constructor(channel: number, brightness: number, decay: number, minBrightness: number, maxBrightness: number) {
        this.channel = channel;
        this.brightness = brightness;
        this.decay = decay;
        this.minBrightness = minBrightness;
        this.maxBrightness = maxBrightness;
    }

    on() {  
        this.state = true;
    }

    off() {
        this.state = false;
    }

    update() {
        if (this.state) {
            this.brightness = this.maxBrightness;
        }
        else if (this.brightness > this.minBrightness) {
            this.brightness = Math.max(this.brightness - this.decay, this.minBrightness);
        }
    }
}