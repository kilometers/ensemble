/*
 * sync.ts
 * Maintain an internal tempo while allowing for accepting a sync signal from an external source. Both the internal clock and the external clocks would be sixteenth note based () with no sub-divisions. This is to keep things simple and to allow for easy syncing with other devices. Each micro:bit will ultimately use the internal clock to drive the tempo of the device. The external clock will be used to sync the internal clock, gradually adjusting the internal clock to match the external clock. There should be logic to handle missed packets (meaning missed sync signals)
 */

class CountRecord {
    count: number;
    time: number;
}

class CountPrediction {
    nextCount: number;
    timeToNextCount: number;
    averageCountLength: number;
}

namespace ensemble {
 
    export enum BeatValue {
        WHOLE = 1,
        HALF = 2,
        QUARTER = 4,
        EIGHTH = 8,
        SIXTEENTH = 16
    }

    export let beatHandler: (beat: number, bar :number, beatLength: number, count: number) => void = (beat: number, bar :number, beatLength: number, count: number) => { };
    export let halfBeatHandler: (beat: number, bar :number, beatLength: number, count: number) => void = (beat: number, bar :number, beatLength: number, count: number) => { };
    export let count = 0;
    export let beatValue = BeatValue.EIGHTH;
    export let beatsPerBar = 4;
    export let tempo = 120;

    let lastExternalMetronomeTime = input.runningTime();
    let lastExternalMetronomeCount = 0;
    
    let adjustmentFactor = 0.01; // Reduced aggressiveness to prevent oscillation
    let smoothingFactor = 0.9; // For exponential smoothing

    // basic.pause(((240000 / beatValue) / tempo));;
    let useExternalBeat = false;
    let internalMetronomeStarted = false;

    /*
     * On beat callback
     */
    //% block="on beat $beat $bar $beatLength $count"
    //% draggableParameters="reporter"
    //% group="Sync"
    export function onBeat(handler: (beat: number, bar :number, beatLength: number, count: number) => void) {
        beatHandler = (beat: number, bar :number, beatLength: number, count: number) => handler(beat, bar, beatLength, count);
    }

    /*
     * On half beat
     */
    //% block="on half beat $beat $bar $beatLength $count"
    //% draggableParameters="reporter"
    //% group="Sync"
    export function onHalfBeat(handler: (beat: number, bar :number, beatLength: number, count: number) => void) {
        halfBeatHandler = (beat: number, bar :number, beatLength: number, count: number) => handler(beat, bar, beatLength, count);
    }

    /*
     * Set time signature
     */
    //% block="set time signature to $bpb / 4"
    //% bpb.defl=4 bpb.min=2 bpb.max=16
    //% group="Sync"
    export function setTimeSignature(bpb: number) {
        beatsPerBar = bpb;
    }

    /*
     * Set the tempo
     */
    //% block="set tempo to $t BPM"
    //% t.defl=120 t.min=20 t.max=999
    //% group="Sync"
    export function setTempo(t: number) {
        tempo = t;
    }

    /*
     * Start the internal metronome
     */
    //% block="start internal metronome"
    //% group="Sync"
    export function startInternalMetronome() {
        if (internalMetronomeStarted) {
            return;
        }
        control.inBackground(() => {
            while (true) {
                // Exact sync adjustment based on timing differences
                let currentTime = input.runningTime();
                let expectedExternalTime = lastExternalMetronomeTime + (240000 / (beatValue * tempo)) * (lastExternalMetronomeCount - count);
                let timingDifference = currentTime - expectedExternalTime;

                let smoothedDifference = timingDifference * smoothingFactor;
                
                tempo -= (smoothedDifference / (240000 / (beatValue * tempo))) * adjustmentFactor;

                const beat = count % beatsPerBar;

                // Call beat handler
                beatHandler(beat, Math.floor(count / beatsPerBar), ((240000 / beatValue) / tempo), count);

                // Pause for the beat length
                basic.pause(((240000 / beatValue) / tempo));
                count += 1;
            }
        });
        internalMetronomeStarted = true;
    }

    /*
     * Use external metronome
     * The external signal should simply be an incrementing integer, never repeating
     */
    //% block="trigger beat with count $externalCount"
    export function triggerBeatWithCount(externalCount: number) {
        const beat = externalCount % beatsPerBar;
        const beatLength = Math.round((input.runningTime() - lastExternalMetronomeTime) / (externalCount - lastExternalMetronomeCount));
        beatHandler(beat, Math.floor(count / beatsPerBar), beatLength, externalCount);
        halfBeatHandler(beat, Math.floor((count * 2) / beatsPerBar), beatLength, count * 2);
        basic.pause(beatLength / 2);
        halfBeatHandler(beat, Math.floor((count * 2 + 1) / beatsPerBar), beatLength, count * 2 + 1);
        lastExternalMetronomeCount = externalCount;
        lastExternalMetronomeTime = input.runningTime();
    }

    /*
     * Set beat value. Default is 8th note (EIGHTH). This won't directly affect tempo, rather the way the tempo is divided and thus how frequently the "on beat" event is called.
     */
    //% block="set beat value to $value"
    //% group="Sync"
    //% beat.defl=BeatValue.EIGHTH
    export function setBeatValue(value: BeatValue) {
        beatValue = value;
    }

    /*
     * Get an external metronome's beat
     * The saved beats are used to sync the internal metronome
     */
    //% block="sync with external metronome $externalCount"
    //% group="Sync"
    export function syncWithExternalMetronome(externalCount: number) {
        useExternalBeat = true;
        lastExternalMetronomeCount = externalCount;
        lastExternalMetronomeTime = input.runningTime();
    }
        
}