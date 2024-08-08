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
    export let internalCount = 0;
    export let beatValue = BeatValue.EIGHTH;
    export let beatsPerBar = 4;
    export let tempo = 120;

    let lastExternalMetronomeTime = input.runningTime();
    let lastExternalMetronomeCount = 0;

    let externalCountLog: { count: number, time: number }[] = []; // History of external counts
    let historySize = 4;
    
    let adjustmentFactor = 0.01; // Reduced aggressiveness to prevent oscillation
    let smoothingFactor = 0.9; // For exponential smoothing

    // basic.pause(((240000 / beatValue) / tempo));;
    let useExternalCount = false;
    let predictedExternalCount = 0;
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
                let averageTempo = calculateAverageTempo();

                // Adjust tempo towards the average tempo
                tempo = (tempo * 0.5) + (averageTempo * 0.5);

                // Calculate beat length after tempo adjustment
                let beatLength = ((240000 / beatValue) / tempo);
                const beat = internalCount % beatsPerBar;

                // Call beat handler
                beatHandler(beat, Math.floor(internalCount / beatsPerBar), beatLength, internalCount);

                predictExternalCount()
                // Sync internalCount with predictedExternalCount
                if (predictedExternalCount !== 0) {
                    internalCount = predictedExternalCount;
                } else {
                    internalCount += 1;
                }

                let nextExpectedExternalBeat = calculateNextExpectedExternalBeat();
                let currentTime = input.runningTime();
                let timeToNextBeat = nextExpectedExternalBeat - currentTime;

                if (timeToNextBeat > 0) {
                    basic.pause(timeToNextBeat); // Adjust pause to sync with external beat
                } else {
                    // If we're late for the next beat, shorten the pause duration
                    basic.pause(beatLength + timeToNextBeat);
                }
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
        beatHandler(beat, Math.floor(internalCount / beatsPerBar), beatLength, externalCount);
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
        useExternalCount = true;
        let currentTime = input.runningTime();

        // Add received count and time to history
        externalCountLog.push({ count: externalCount, time: currentTime });

        // Ensure the history size does not exceed the limit
        if (externalCountLog.length > historySize) {
            externalCountLog.shift();
        }
        
    }

    function calculateAverageTempo(): number {
        if (!useExternalCount || externalCountLog.length < 2) {
            return tempo; // Not enough data to calculate
        }
    
        let totalDifference = 0;
        let countDifferences = 0;
        
        for (let i = 1; i < externalCountLog.length; i++) {
            let timeDiff = externalCountLog[i].time - externalCountLog[i - 1].time;
            let countDiff = externalCountLog[i].count - externalCountLog[i - 1].count;
            totalDifference += (countDiff / timeDiff) * 60000; // Convert to BPM
            countDifferences += 1;
        }
    
        // Calculate average tempo based on history
        return totalDifference / countDifferences;
    }

    function calculateNextExpectedExternalBeat(): number {
        if (!useExternalCount || externalCountLog.length < 2) {
            return input.runningTime(); // Not enough data to predict
        }
    
        let lastExternal = externalCountLog[externalCountLog.length - 1];
        let secondLastExternal = externalCountLog[externalCountLog.length - 2];
        
        let timeDiff = lastExternal.time - secondLastExternal.time;
        let countDiff = lastExternal.count - secondLastExternal.count;
        let averageBeatDuration = timeDiff / countDiff;
    
        let nextExpectedBeatTime = lastExternal.time + averageBeatDuration * (internalCount - lastExternal.count + 1);
        return nextExpectedBeatTime;
    }

    function predictExternalCount(): void {
        if (externalCountLog.length < 2) {
            return;
        }
    
        let averageTempo = calculateAverageTempo();
        let averageBeatDuration = 60000 / averageTempo;
        
        let lastExternal = externalCountLog[externalCountLog.length - 1];
        let currentTime = input.runningTime();
    
        // Predict the next external count based on the time elapsed
        let timeElapsed = currentTime - lastExternal.time;
        let predictedCountDelta = Math.round(timeElapsed / averageBeatDuration);
        predictedExternalCount = lastExternal.count + predictedCountDelta;
    }
}