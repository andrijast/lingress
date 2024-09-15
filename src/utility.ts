
export type byte_array = Uint8Array;
export type ascii_string = string;
export type unicode_string = string;

export function showBinary(buf: byte_array, sep: string = ' ') {
    const binaryString = Array.from(buf).map(byte => byte.toString(2).padStart(8, '0')).join(sep);
    console.log(binaryString);
}

