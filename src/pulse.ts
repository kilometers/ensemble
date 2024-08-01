class Pulse {
    pin: DigitalPin
    start: number
    duration: number

    constructor(pin: DigitalPin, duration?: number) {
        this.pin = pin;
        this.start = input.runningTime();
        this.duration = duration | 40;
        pins.digitalWritePin(pin, 1);
    }
}

namespace ensemble {
    let pulses: Pulse[] = [];

    /**
     * Pulse a pin on the Microbit
     * Useful for triggering solenoids
     */
    //% block="pulse pin $pin for $duration ms"
    //% duration.defl=40 duration.min=10 duration.max=5000
    //% group="MIDI"
    export function pulsePin(pin: DigitalPin, duration: number) {
        pulses.push(new Pulse(pin, duration));
    }

    /**
     * Handle pulses
     * This function should be called in the forever loop and is non-blocking
     */
    //% block="handle pulses"
    //% group="MIDI"
    export function handlePulses() {
        for (let i = 0; i < pulses.length; i++) {
            let pulse = pulses[i];
            if (input.runningTime() - pulse.start > pulse.duration) {
                pins.digitalWritePin(pulse.pin, 0);
            }
        }

        pulses = pulses.filter(pulse => input.runningTime() - pulse.start < pulse.duration);
    }
}