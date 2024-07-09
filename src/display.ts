namespace ensemble {
    
    // This is a class that represents an LED that can be pulsed on and slowly fade off.
    export class IndicatorLed {
        brightness = 0;
        decay = 30;
        minBrightness =  0;
        maxBrightness = 255;

        activate(strength: number) {  
            this.brightness = this.maxBrightness * strength / 100;
        }

        update() {
            if (this.brightness > this.minBrightness) {
                this.brightness = Math.max(this.brightness - this.decay, this.minBrightness);
            }
        }
    }

    // a 16 item array of ChannelLed objects
    export let channelLeds: IndicatorLed[] = [];
    for (let i = 0; i < 16; i++) {
        channelLeds.push(new IndicatorLed());
    }

    // a 25 item array of NoteLed objects covering the
    // microbit's 5x5 LED display
    export let noteLeds: IndicatorLed[] = [];
    for (let i = 0; i < 25; i++) {
        noteLeds.push(new IndicatorLed());
    }
}
