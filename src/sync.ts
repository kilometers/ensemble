/*
 * sync.ts
 * Maintain an internal tempo while allowing for accepting a sync signal from an external source. Both the internal clock and the external clocks would be sixteenth note based () with no sub-divisions. This is to keep things simple and to allow for easy syncing with other devices. Each micro:bit will ultimately use the internal clock to drive the tempo of the device. The external clock will be used to sync the internal clock, gradually adjusting the internal clock to match the external clock. There should be logic to handle missed packets (meaning missed sync signals)
 */

class BeatRecord {
    beat: number;
    time: number;
}

class BeatPrediction {
    nextBeat: number;
    timeToNextBeat: number;
    averageBeatLength: number;
}

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
    let externalBeatHistory: BeatRecord[] = [];
    let externalBeatLength = (240000 / beatValue) / tempo;

    basic.pause(((240000 / beatValue) / tempo));;
    let useExternalBeat = false;
    let internalMetronomeStarted = false;
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
    //% t.defl=120 t.min=20 t.max=999
    //% group="Sync"
    export function setTempo(t: number) {
        tempo = t;
    }

    /*
     * Start the internal metronome
     */
    //% block="start internal metronome || repeating every $c beats"
    //% count.defl=4 count.min=2
    //% expandableArgumentMode="toggle"
    //% group="Sync"
    export function startInternalMetronome(c?: number) {
        if (internalMetronomeStarted) {
            return;
        }
        let count = c ? c : 4;
        control.inBackground(() => {
            while (true) {
                if (useExternalBeat && externalBeatHistory.length > 1) {
                    const prediction = predictNextBeat();
                    if (prediction) {
                        let thisBeat = (prediction.nextBeat - 1);
                        if(thisBeat < 0) {
                            thisBeat = count - 1;
                        }
                        thisBeat = thisBeat % count;
                        beatHandler(thisBeat, prediction.averageBeatLength);
                        beat = (thisBeat + 1) % count;
                        basic.pause(prediction.timeToNextBeat);
                    } else {
                        basic.pause(1);
                    }
                } else if (useExternalBeat) {
                    beatHandler(beat, externalBeatLength);
                    beat = (beat + 1) % count;

                    basic.pause(externalBeatLength);
                } else {
                    beatHandler(beat, (240000 / beatValue) / tempo);
                    beat = (beat + 1) % count;

                    basic.pause(((240000 / beatValue) / tempo));
                }
            }
        });
        internalMetronomeStarted = true;
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
    //% block="sync with external metronome $externalBeat"
    //% group="Sync"
    export function syncWithExternalBeat(externalBeat: number) {
        externalBeatHistory.push({ beat: externalBeat, time: input.runningTime() });
        if(externalBeatHistory.length > 4) {
            externalBeatHistory.shift();
        }
    }

    /*
     * Predict the next beat based on the external beat history
     * Should work even if packets have been missed (i.e. the external beat is not perfectly recorded)
     * Since each beat is numbered incrementally, even if a beat is missed (this is coming in over radio) the next beat can be predicted though there may be gaps in the beat history
     */
    function predictNextBeat(): BeatPrediction {
        if (externalBeatHistory.length < 2) {
            return null;
        }

        let historyTotal = 0;
        let historyCount = 0;
        for(let i = 0; i < externalBeatHistory.length - 1; i++) {
            let current = externalBeatHistory[i];
            let next = externalBeatHistory[i + 1];

            let timeDelta = next.time - current.time;
            let beatDelta = next.beat - current.beat;

            historyTotal += timeDelta / beatDelta;
            historyCount++;
        }
        const averageBeatLength = historyTotal / historyCount;
        const timeSinceLastBeat = input.runningTime() - externalBeatHistory[externalBeatHistory.length - 1].time;

        // Should I use ceil or floor here?
        const nextBeat = externalBeatHistory[externalBeatHistory.length - 1].beat + Math.ceil(timeSinceLastBeat / averageBeatLength);

        const timeToNextBeat = averageBeatLength - (timeSinceLastBeat % averageBeatLength);
        
        return {
            nextBeat,
            timeToNextBeat,
            averageBeatLength
        };
    }   
        
}