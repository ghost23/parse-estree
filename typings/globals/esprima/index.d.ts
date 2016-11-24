// Generated by typings
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/6389aa9b3725b78c98cb4d19b1948879bd2d175c/esprima/esprima.d.ts

declare namespace esprima {

    const version: string;

    function parse(code: string, options?: Options): Object;
    function tokenize(code: string, options?: Options): Array<Token>;

    interface Token {
        type: string;
        value: string;
    }

    interface Comment extends Node {
        value: string;
    }

    interface Options {
        loc?: boolean;
        range?: boolean;
        raw?: boolean;
        tokens?: boolean;
        comment?: boolean;
        attachComment?: boolean;
        tolerant?: boolean;
        source?: boolean;
        sourceType?: 'script' | 'module';
    }
}

declare module "esprima" {
    export = esprima
}