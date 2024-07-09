namespace ensemble {
    export enum Channel {
        "#1" = 0,
        "#2" = 1,
        "#3" = 2,
        "#4" = 3,
        "#5" = 4,
        "#6" = 5,
        "#7" = 6,
        "#8" = 7,
        "#9" = 8,
        "#10" = 9,
        "#11" = 10,
        "#12" = 11,
        "#13" = 12,
        "#14" = 13,
        "#15" = 14,
        "#16" = 15,
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
