declare namespace Chalk {

    export interface ChalkStyle {
        bold: ChalkChain;
        underline: ChalkChain;
        blue: ChalkChain;
        magenta: ChalkChain;
        dim: ChalkChain;
    }

    export interface ChalkChain extends ChalkStyle {
        (...text: string[]): string;
    }

    export var bold: ChalkChain;
    export var underline: ChalkChain;
    export var blue: ChalkChain;
    export var magenta: ChalkChain;
    export var dim: ChalkChain;

}

declare module "chalk" {
    export = Chalk;
}
