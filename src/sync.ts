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

    let lastExternalMetronomeTime = 0;
    let lastExternalMetronomeCount = 0;

    let externalCountHistory: CountRecord[] = [];

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
                let beatLength = ((240000 / beatValue) / tempo);
                if(useExternalBeat && externalCountHistory.length > 1) {
                    const prediction = predictNextCount();
                    if (prediction) {
                        beatLength = prediction.averageCountLength;
                        if(prediction.timeToNextCount < prediction.averageCountLength / 2) {
                            basic.pause(prediction.timeToNextCount);
                        } else {
                            beatLength = prediction.averageCountLength - prediction.timeToNextCount;
                        }
                    }
                }
                

                const beat = count % beatsPerBar;
                beatHandler(beat, Math.floor(count / beatsPerBar), beatLength, count);
                halfBeatHandler(beat, Math.floor((count * 2) / beatsPerBar), beatLength, count);
                basic.pause(beatLength / 2);
                halfBeatHandler(beat, Math.floor((count * 2 + 1) / beatsPerBar), beatLength, count);
                count += 1;
                basic.pause(beatLength / 2);
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
    // % block="sync with external metronome $externalCount"
    // % group="Sync"
    export function syncWithExternalMetronome(externalCount: number) {
        externalCountHistory.push({ count: externalCount, time: input.runningTime() });
        if(externalCountHistory.length > 4) {
            externalCountHistory.shift();
        }
    }

    /*
     * Predict the next beat based on the external beat history
     * Should work even if packets have been missed (i.e. the external beat is not perfectly recorded)
     * Since each beat is numbered incrementally, even if a beat is missed (this is coming in over radio) the next beat can be predicted though there may be gaps in the beat history
     */
    function predictNextCount(): CountPrediction {
        if (externalCountHistory.length < 2) {
            return null;
        }

        let historyTotal = 0;
        let historyCount = 0;
        for(let i = 0; i < externalCountHistory.length - 1; i++) {
            let current = externalCountHistory[i];
            let next = externalCountHistory[i + 1];

            let timeDelta = next.time - current.time;
            let beatDelta = next.count - current.count;

            historyTotal += timeDelta / beatDelta;
            historyCount++;
        }
        const averageCountLength = historyTotal / historyCount;
        const timeSinceLastCount = input.runningTime() - externalCountHistory[externalCountHistory.length - 1].time;

        // Should I use ceil or floor here?
        const nextCount = externalCountHistory[externalCountHistory.length - 1].count + Math.ceil(timeSinceLastCount / averageCountLength);

        const timeToNextCount = averageCountLength - (timeSinceLastCount % averageCountLength);
        
        return {
            nextCount,
            timeToNextCount,
            averageCountLength
        };
    }   
        
}