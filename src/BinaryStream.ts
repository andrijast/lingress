import { showBinary, type byte_array } from "./utility";

type bit = "0" | "1";

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

function test() {

    const bs = new BinaryStream();

    bs.appendString("001");
    bs.appendString("1101");
    bs.appendString("1010");

    showBinary(bs.toBytes());

    console.log(bs.take())
    console.log(bs.take())
    console.log(bs.take())
    console.log(bs.take())
    console.log(bs.take())

    showBinary(bs.toBytes());
    // 00111011 010'00000

}

if (import.meta.main) {
    test();
}

