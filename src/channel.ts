namespace ensemble {
    export enum Channel {
        System = 255,
        _1 = 0,
        _2 = 1,
        _3 = 2,
        _4 = 3,
        _5 = 4,
        _6 = 5,
        _7 = 6,
        _8 = 7,
        _9 = 8,
        _10 = 9,
        _11 = 10,
        _12 = 11,
        _13 = 12,
        _14 = 13,
        _15 = 14,
        _16 = 15,
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
}
