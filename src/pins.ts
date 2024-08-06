namespace ensemble {
    /*
     * Analog write pin with linear interpolation
     */
    //% block="analog write pin $pin from $from to $to over $duration ms"
    //% duration.defl=100
    //% group="Pins"
    //% color="#b82424"
    export function analogWritePinLinear(pin: AnalogPin, from: number, to: number, duration: number) {
        control.runInParallel(() => {
            if (duration <= 0) {
                pins.analogWritePin(pin, to);
                return;
            }

            let current = from;
            let ratio = (to - from) / duration;
            let lastTime = input.runningTime();

            while (current < to) {
                pins.analogWritePin(pin, current);
                const deltaTime = input.runningTime() - lastTime;
                current += ratio * deltaTime;
                lastTime = input.runningTime();
                basic.pause(10);
            }
        });
    }


    /*
     * Digital write pin on beat sequence
     */
    //% block="digital write pin $pin on beat $beat sequence $sequence"
    //% group="Pins"
    //% inlineInputMode=inline
    //% color="#b82424"
    export function digitalWritePinSequence(pin: DigitalPin, beat: number, sequence: number[]) {
        
        if (sequence.length === 0 || sequence[beat % sequence.length] === 0) {
            return;
        }
        pins.digitalWritePin(pin, 1);
        delayedDigitalWritePin(pin, 0, sequence[beat % sequence.length]);
    }
    
    /*
     * Delayed digital write pin
     */
    //% block="digital write pin $pin to $value after $duration ms"
    //% duration.defl=40 duration.min=10
    //% group="Pins"
    //% color="#b82424"
    export function delayedDigitalWritePin(pin: DigitalPin, value: number, duration: number) {
        control.runInParallel(() => {
            basic.pause(duration);
            pins.digitalWritePin(pin, value);
        });
    }

    /*
     * Delayed analog write pin
     */
    //% block="analog write pin $pin to $value after $duration ms"
    //% duration.defl=40
    //% group="Pins"
    //% color="#b82424"
    export function delayedAnalogWritePin(pin: AnalogPin, value: number, duration: number) {
        control.runInParallel(() => {
            basic.pause(duration);
            pins.analogWritePin(pin, value);
        });
    }
}