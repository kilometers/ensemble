// /*
//      * Start the internal clock
//      */
//     //% block="start internal clock"
//     //% group="Sync"
//     export function startInternalMetronome() {
//         control.inBackground(() => {
//             while (true) {
//                 const syncDelta = input.runningTime() - lastExternalBeatTime; // Time since last external beat
//                 const timeShift = lastExternalBeatLength - syncDelta;
//                 if (useExternalBeat && timeShift > 0) {
//                     basic.pause(timeShift); // Adjust internal beat length to match external beat length

//                     // beat = syncDelta > lastExternalBeatLength / 2 ? lastExternalBeat : lastExternalBeat + 1;
//                 }
//                 beatHandler(beat, (240000 / beatValue) / tempo);
//                 beat = beat + 1;

//                 // If controlled by an externa beat, use the last external beat length, otherwise calculate the internal beat length based on tempo and beat value
//                 if(timeShift < 0 && )
//                 basic.pause(useExternalBeat && lastExternalBeatLength > 0 ?
//                     lastExternalBeatLength
//                     : ((240000 / beatValue) / tempo));
//             }
//         });
//     }

//     /*
//      * Set beat value. Default is 8th note (EIGHTH). This won't directly affect tempo, rather the way the tempo is divided and thus how frequently the "on beat" event is called.
//      */
//     //% block="set beat value to $value"
//     //% group="Sync"
//     //% beat.defl=BeatValue.EIGHTH
//     export function setBeatValue(value: BeatValue) {
//         beatValue = value;
//     }

//     /*
//      * Offset sync based on an external beat
//      */
//     //% block="sync with external beat $externalBeat $externalBeatLength"
//     //% group="Sync"
//     export function syncOffsetFromExternalBeat(externalBeat: number, externalBeatLength: number) {
//         lastExternalBeatTime = input.runningTime();
//         lastExternalBeat = externalBeat;
//         lastExternalBeatLength = externalBeatLength;
//     }