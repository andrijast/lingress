import { appendFileSync } from "node:fs";

export type byte_array = Uint8Array;
export type ascii_string = string;
export type unicode_string = string;
export type bit = "0" | "1";
export type dict_entry = {word: string, freq: number};

export interface IBinaryStream {
    append(bit: bit): void;
    appendString(string: string): void;
    appendInt(int: number): void;
    take(): bit | null;
    toBytes(): byte_array;
}

export class BinaryStream implements IBinaryStream {

    buffer: bit[] = [];

    constructor(arr?: byte_array) {
        if (arr)
            this.buffer = [...arr].flatMap(b => b.toString(2).padStart(8, '0').split('') as bit[]);
    }

    append(bit: bit) {
        if (bit !== "0" && bit !== "1")
            throw new Error("bad string tbh");
        this.buffer.push(bit);
    }

    appendString(string: string): void {
        for (const c of string)
            this.append(c as bit)
    }

    appendInt(int: number): void {
        this.appendString(int.toString(2));
    }

    take(): bit | null {
        if (this.buffer.length == 0) return null;
        return this.buffer.shift() ?? null;
    }

    toBytes(): byte_array {
        const n = this.buffer.length;
        const str = this.buffer.join('').padEnd(Math.ceil(n / 8) * 8, '0');
        const byteChunks = str.match(/.{1,8}/g) || [];
        const byteArray = new Uint8Array(byteChunks.map(byte => parseInt(byte, 2)));
        return byteArray;
    }

}


export function showBinary(buf: byte_array, sep: string = ' ') {
    const binaryString = Array.from(buf).map(byte => byte.toString(2).padStart(8, '0')).join(sep);
    console.log(binaryString);
}

const first_time = new Set<string>();

export async function debug(filename: string, content: any) {
    const file = (typeof content === "string") ?
        `./debug/${filename}.log.txt`:
        `./debug/${filename}.log.js`;
    const line = (typeof content === "string") ?
        `${content}\n`:
        `${Bun.inspect(content)}\n`;
    if (!first_time.has(filename)) {
        Bun.write(file, line);
        first_time.add(filename);
    }
    else {
        appendFileSync(file, line);
    }
}


function test() {

    const bs = new BinaryStream();

    bs.appendString("01");
    bs.appendString("1101");

    showBinary(bs.toBytes());

    console.log(bs.take())
    console.log(bs.take())
    console.log(bs.take())

    showBinary(bs.toBytes());
    // 00111011 010'00000

    debug("test", "something");
    debug("test", "something else");
}

if (import.meta.main) {
    test();
}

