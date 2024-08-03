/*
 * sync.ts
 * Maintain an internal tempo while allowing for accepting a sync signal from an external source. Both the internal clock and the external clocks would be sixteenth note based () with no sub-divisions. This is to keep things simple and to allow for easy syncing with other devices. Each micro:bit will ultimately use the internal clock to drive the tempo of the device. The external clock will be used to sync the internal clock, gradually adjusting the internal clock to match the external clock. There should be logic to handle missed packets (meaning missed sync signals)
 */

namespace ensemble {
 
    export enum BeatValue {
        WHOLE = 1,
        HALF = 2,
        QUARTER = 4,
        EIGHTH = 8,
        SIXTEENTH = 16
    }

    export let beatHandler: (beat: number, beatLength: number) => void = (beat: number, beatLength: number) => { };
    export let beat = 0;
    export let beatValue = BeatValue.EIGHTH;
    export let tempo = 120;

    /*
     * On beat callback
     */
    //% block="on beat $beat $beatLength"
    //% draggableParameters="reporter"
    //% group="Sync"
    export function onBeat(handler: (beat: number, beatLength: number) => void) {
        beatHandler = (beat: number, beatLength: number) => handler(beat, beatLength);
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
                beatHandler(beat, (240000 / beatValue) / tempo);
                beat = (beat + 1) % 16;
                basic.pause((240000 / beatValue) / tempo);
            }
        });
    }

    /*
     * Set beat value
     */
    //% block="set beat to $value"
    //% group="Sync"
    //% beat.defl=BeatValue.EIGHTH
    export function setBeatValue(value: BeatValue) {
        beatValue = value;
    }
}