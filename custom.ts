//% color=#fbbc05 icon="\uf11c"
namespace custom {

    export enum ButtonList {
        //% block="A"
        A = Button.A,
        //% block="B"
        B = Button.B,
        //% block="A+B"
        AB = Button.AB
    }

    //% block="on button $button pressed"
    //% button.shadow="dropdown"
    export function onButtonPressed(button: ButtonList, handler: () => void) {
    }
}