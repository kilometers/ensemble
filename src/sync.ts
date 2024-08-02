/*
 * sync.ts
 * Maintain an internal tempo while allowing for accepting a sync signal from an external source. Both the internal clock and the external clocks would be sixteenth note based () with no sub-divisions. This is to keep things simple and to allow for easy syncing with other devices. Each micro:bit will ultimately use the internal clock to drive the tempo of the device. The external clock will be used to sync the internal clock, gradually adjusting the internal clock to match the external clock. There should be logic to handle missed packets (meaning missed sync signals)
 */

namespace ensemble {
 
    export enum PulseValue {
        WHOLE = 1,
        HALF = 2,
        QUARTER = 4,
        EIGHTH = 8,
        SIXTEENTH = 16
    }

    export let pulseHandler: (pulse: number, pulseLength: number) => void = (pulse: number, pulseLength: number) => { };
    export let pulse = 0;
    export let pulseValue = PulseValue.EIGHTH;
    export let tempo = 120;

    /*
     * On pulse callback
     */
    //% block="on pulse $pulse $pulseLength"
    //% draggableParameters="reporter"
    //% group="Sync"
    export function onPulse(handler: (pulse: number, pulseLength: number) => void) {
        pulseHandler = (pulse: number, pulseLength: number) => handler(pulse, pulseLength);
    }

    /*
     * Set the tempo
     */
    //% block="set tempo to $t BPM"
    //% group="Sync"
    export function setTempo(t: number) {
        tempo = t;
    }

    /*
     * Start the internal clock
     */
    //% block="start internal clock"
    //% group="Sync"
    export function startInternalMetronome() {
        control.inBackground(() => {
            while (true) {
                pulseHandler(pulse, (240000 / pulseValue) / tempo);
                pulse++;
                basic.pause((240000 / pulseValue) / tempo);
            }
        });
    }

    /*
     * Set pulse value
     */
    //% block="set pulse to $pulse"
    //% group="Sync"
    //% pulse.defl=PulseValue.EIGHTH
    export function setPulseValue(pulse: PulseValue) {
        pulseValue = pulse;
    }
}