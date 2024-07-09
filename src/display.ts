namespace ensemble {
    
    // This is a class that represents an LED that can be pulsed on and slowly fade off.
    export class IndicatorLed {
        brightness = 0;
        decay = 30;
        minBrightness =  0;
        maxBrightness = 255;

        constructor() {
            // nothing to do here
        }

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
    let channelLeds: IndicatorLed[] = [];
    for (let i = 0; i < 16; i++) {
        channelLeds.push(new IndicatorLed());
    }

    // a 25 item array of NoteLed objects covering the
    // microbit's 5x5 LED display
    let noteLeds: IndicatorLed[] = [];
    for (let i = 0; i < 25; i++) {
        noteLeds.push(new IndicatorLed());
    }

    export function activateChannelLed(index: number, strength: number) {
        channelLeds[index].activate(strength);
    }

    export function activateNoteLed(index: number, strength: number) {
        noteLeds[index].activate(strength);
    }

    /**
     * Update the display to show the current broadcast status
     * NOTE: Only use this in an Instrument microbit
     */
    //% block="show instrument note display"
    //% group="Instrument"
    export function showInstrumentNoteDisplay() {
        basic.clearScreen();

        // Render note indicators
        for (let i = 0; i < 25; i++) {
            noteLeds[i].update();
            led.plotBrightness(i % 4, Math.floor(i / 4), noteLeds[i].brightness);
        }
    }

    /**
     * Update the display to show the current broadcast status
     * NOTE: Only use this in a Musician microbit
     */
    //% block="show musician broadcast display"
    //% group="Musician"
    export function showMusicianBroadcastDisplay() {
        basic.clearScreen();

        // Render channel indicators
        for (let i = 0; i < 16; i++) {
            channelLeds[i].update();
            led.plotBrightness(i % 4, Math.floor(i / 4), channelLeds[i].brightness);
        }
    }
}
