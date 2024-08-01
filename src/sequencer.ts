/* 16-step sequencer in micro:bit
 * Views
 * - Track view: Users can cycle through 4 bars of 4 beats. Each beat can be toggled on or off. The *   current beat is highlighted. Each MIDI-channel has its own track, with 16 notes available.
 * - Pattern view: Users can cycle through 16 patterns. Each pattern is a sequence of 16 tracks.
 * - Tempo view: Users can change the tempo of the sequencer.
 * 
 * Modals
 * - Conductor modal: Just yes/no. Users can accept an invitation to join the ensemble. The
 *   ensemble's conductor can change the tempo and mute/unmute musicians.
 * 
 * General Controls
 * - shake: toggle between track, pattern and tempo views
 * - logo: play/pause the sequencer
 * 
 * Track View Controls
 * - A: toggle beat on/off
 * - B: move to next beat
 * - tilt up/down: move to a higher/lower pitch
 * - A+B: move to next track (MIDI-channel)
 * 
 * Pattern View Controls
 * - A: move to previous pattern
 * - B: move to next pattern
 * 
 * Tempo View Controls
 * - A: decrease tempo
 * - B: increase tempo
 * - A+B: mute/unmute musician
 */

class MicroMIDINote {
    velocity: number = 0; // 0-7
    pitch: number = 0; // 0-15

    constructor() {
        // Gotta make Makecode happy
    }
}

class Track {
    beats: MicroMIDINote[][] = []; // 16 notes

    constructor() {
        // Initialize the track
        for (let i = 0; i < 16; i++) {
            this.beats[i] = [];
        }
    }

    toggleNote(beat: number, pitch: number) {
        if (beat < 0 || beat > 15) {
            // Toggle the note on or off
            if (this.beats[beat][pitch]) {
                this.beats[beat][pitch] = null;
            }
            else {
                this.beats[beat][pitch] = new MicroMIDINote();
                this.beats[beat][pitch].pitch = pitch;
                this.beats[beat][pitch].velocity = 7;
            }
        }
    }
}

class Pattern {
    tracks: Track[] = []; // 16 tracks

    constructor() {
        // Initialize the pattern
        for (let i = 0; i < 16; i++) {
            this.tracks.push(new Track());
        }
    }
}

namespace ensemble {
    export enum SequencerView {
        Track,
        Pattern,
        Tempo
    }

    let lastBeatTime = 0;
    let currentBeat = 0; // 0-15
    let selectedBeat = 0; // 0-15
    let selectedTrack = 0; // 0-15
    let selectedPattern = 0; // 0-15
    let tempo = 100; // 20-200
    let muted = false;
    let playing = false;
    let view = SequencerView.Track;
    let patterns: Pattern[] = [];

    // Track view variables
    let selectedPitch = 0;

    /**
     * Initialize the sequencer controls and loop
     */
    //% block="initialize sequencer for band $cb"
    export function initSequencer(cb: ChannelBand) {
        // Initialize the patterns
        for (let i = 0; i < 16; i++) {
            patterns.push(new Pattern());
        }

        // Initialize the sequencer
        input.onButtonPressed(Button.A, function () {
            if (view === SequencerView.Track) {
                toggleNote();
            } else if (view === SequencerView.Pattern) {
                previousPattern();
            } else if (view === SequencerView.Tempo) {
                decreaseTempo();
            }
        });
            
        input.onButtonPressed(Button.B, function () {
            if (view === SequencerView.Track) {
                nextBeat();
            } else if (view === SequencerView.Pattern) {
                nextPattern();
            } else if (view === SequencerView.Tempo) {
                increaseTempo();
            }
        });

        input.onButtonPressed(Button.AB, function () {
            if (view === SequencerView.Track) {
                nextTrack();
            } else if (view === SequencerView.Tempo) {
                toggleMute();
            }
        });

        // Toggle between track and pattern view
        input.onShake(function () {
            if (view === SequencerView.Track) {
                view = SequencerView.Pattern;
            } else {
                view = SequencerView.Track;
            }
        });

        input.onLogoEvent(TouchButtonEvent.Pressed, function () {
            playing = !playing;
        });

        // Move to a higher pitch
        input.onLogoUp(function () {
            selectedPitch += 1;
            if (selectedPitch > 15) { // cycle back to 0
                selectedPitch = 0;
            }
        });
            
        // Move to a lower pitch
        input.onLogoDown(function () {
            selectedPitch -= 1;
            if (selectedPitch < 0) { // cycle back to 15
                selectedPitch = 15;
            }
        });

        basic.forever(function () {
            if (playing && lastBeatTime + 60000 / tempo < input.runningTime()) {
                currentBeat = (currentBeat + 1) % 16;
                // Play the notes from each track in the selected pattern
                for (let i = 0; i < 16; i++) {
                    const notes = patterns[selectedPattern].tracks[i].beats[currentBeat];
                    for (const note of notes) {
                        if (note && !muted) {
                            queueBroadcastMessage({
                                group: cb * 16 + i,
                                type: "mm",
                                // bit 7 is the note on / off flag (1 or 0)
                                // bits 6-3 are the note (0-15)
                                // bits 2-0 are the velocity (0-7)
                                byte: ((1 << 7) & 0x80) | ((selectedPitch << 3) & 0x78) | (7 & 0x07)
                            });
                        }
                    }
                }
    
                lastBeatTime = input.runningTime();
            }
        });
    }

    // Initialize the sequencer display
    function toggleNote() {
        // Toggle the current beat on or off
        patterns[selectedPattern].tracks[selectedTrack].toggleNote(selectedBeat, selectedPitch);
    }

    function nextBeat() {
        // Move to the next beat
        selectedBeat = (selectedBeat + 1) % 16;
    }

    function nextTrack() {
        // Move to the next track
        selectedTrack = (selectedTrack + 1) % 16;
    }

    function previousPattern() {
        // Move to the previous pattern
        selectedPattern = (selectedPattern - 1) % 16;
    }

    function nextPattern() {
        // Move to the next pattern
        selectedPattern = (selectedPattern + 1) % 16;
    }

    function decreaseTempo() {
        // Decrease the tempo
        tempo = Math.max(20, tempo - 10);
    }

    function increaseTempo() {
        // Increase the tempo
        tempo = Math.min(220, tempo + 10);
    }

    function toggleMute() {
        // Toggle mute
        muted = !muted;
    }

    /**
     * Show the sequencer display
     */
    //% block="show sequencer"
    export function showSequencer() {
        if (view === SequencerView.Track) {
            // Display the track view
            showTrackView();
        } else if (view === SequencerView.Pattern) {
            // Display the pattern view
            showPatternView();
        } else if (view === SequencerView.Tempo) {
            // Display the tempo view
            showTempoView();
        }
    }

    // Display the track view
    function showTrackView() {
        const row = Math.floor(selectedPitch / 4);
        const col = Math.floor(selectedBeat / 4);

        basic.clearScreen();

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const pitch = row * 4 + j;
                const beat = col * 4 + i;
                const note = patterns[selectedPattern].tracks[selectedTrack].beats[beat][pitch];
                if (note && pitch === note.pitch) {
                    led.plotBrightness(i, j, 255);
                } else if(beat === selectedBeat || pitch === selectedPitch) {
                    led.plotBrightness(i, j, 7);
                }
            }
        }

        led.plotBrightness(4, row, 255); // Highlight the current vertical position (pitch)
        led.plotBrightness(col, 4, 255); // Highlight the current horizontal position (beat)
    }

    function showPatternView() {
        basic.clearScreen();

        // Display the pattern view
        // Any patterns with notes on are displayed with a brightness of 100
        // Empty patterns are displayed with a brightness of 0
        for (let i = 0; i < 16; i++) {
            if (patterns[selectedPattern].tracks[selectedTrack].beats.find(notes => notes.length > 0)) {
                led.plotBrightness(i % 4, Math.floor(i / 4), 100);
            }
        }

        led.plotBrightness(selectedPattern % 4, Math.floor(selectedPattern / 4), 255);
    }

    function showTempoView() {
        basic.clearScreen();
        for(let i = 0; i < (tempo - 20) / 10; i++) {
            led.plot(i % 5, Math.floor(i / 5));
        }
        
        // Shuttle a dot back and forth on the fifth row in time with the tempo
        if (playing) {
            const brightness = muted ? 100 : 255;
            if (currentBeat < 8) {
                // Dot moves to the right
                led.plotBrightness(Math.floor(currentBeat / 2), 4, brightness);
            } else {
                // Dot moves to the left
                led.plotBrightness(3 - Math.floor((currentBeat - 8) / 2), 4, brightness);
            }
        }
    }
}
