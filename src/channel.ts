namespace ensemble {
    export enum Channel {
        //%block="1"
        _1 = 0,
        //%block="2"
        _2 = 1,
        //%block="3"
        _3 = 2,
        //%block="4"
        _4 = 3,
        //%block="5"
        _5 = 4,
        //%block="6"
        _6 = 5,
        //%block="7"
        _7 = 6,
        //%block="8"
        _8 = 7,
        //%block="9"
        _9 = 8,
        //%block="10"
        _10 = 9,
        //%block="11"
        _11 = 10,
        //%block="12"
        _12 = 11,
        //%block="13"
        _13 = 12,
        //%block="14"
        _14 = 13,
        //%block="15"
        _15 = 14,
        //%block="16"
        _16 = 15,
        System = 255,
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
        brightness = 0;
        decay = 50;
        minBrightness =  0;
        maxBrightness = 255;
        state = false;

        constructor(channel: number) {
            this.channel = channel;
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
