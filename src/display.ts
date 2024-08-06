namespace ensemble {

    export let lowestNoteForNoteDisplay = 35;
    
    /* This is a class that represents an LED 
     * which can be pulsed on and slowly fade off.
     */
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

    // a 16 item array of IndicatorLed objects
    // representing 16 MIDI channels
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

    /*
     * Activate a channel LED
     * Channel LED's occupy the top left 4x4 grid of the microbit's LED display
     * @param index the index of the LED to activate
     * @param strength the strength of the activation (0-127)
     */
    export function activateChannelLed(index: number, strength: number) {
        channelLeds[index].activate(strength);
    }

    /*
     * Activate a note LED
     * Note LED's occupy the 5x5 grid of the microbit's LED display
     * @param index the index of the LED to activate
     * @param strength the strength of the activation (0-127)
     */
    export function activateNoteLed(index: number, strength: number) {
        noteLeds[index].activate(strength);
    }

    /**
     * Update the display to show the current broadcast status
     * NOTE: Only use this in an Instrument microbit
     * @param note the lowest note to display
     */
    //% block="display received MIDI notes starting at note $note"
    //% note.min=0 note.max=127
    //% note.defl=35
    //% group="Advanced"
    export function showReceivedNoteDisplay(note: number) {
        lowestNoteForNoteDisplay = note;

        basic.clearScreen();

        // Render note indicators
        for (let i = 0; i < 25; i++) {
            noteLeds[i].update();
            led.plotBrightness(i % 5, Math.floor(i / 5), noteLeds[i].brightness);
        }
    }

    /**
     * Update the display to show the current broadcast status
     * NOTE: Only use this in a Musician microbit
     */
    //% block="display sent MIDI notes"
    //% group="Advanced"
    export function showSentMidiDisplay() {
        basic.clearScreen();

        // Render channel indicators
        for (let i = 0; i < 16; i++) {
            channelLeds[i].update();
            led.plotBrightness(i % 4, Math.floor(i / 4), channelLeds[i].brightness);
        }
    }
}
