import type { byte_array, unicode_string } from "./Utility";



export function pack_data(additions: unicode_string[], dict_sz: number, coding: byte_array): byte_array {

    additions.forEach(str => {
        if (str.includes('\x00'))
            throw new Error("zero-byte in text not supported!");
    });

    const addon = new TextEncoder().encode(additions.join('\x00'));

    if (!addon || !coding) throw new Error("Something bad happened");

    const addon_sz = addon.length;
    if (addon_sz >= 65536 || dict_sz >= 65536) throw new Error("Unfortunate, probably addon too big");
    const lead = new Uint8Array([dict_sz&0xFF, (dict_sz>>8)&0xFF, addon_sz&0xFF, (addon_sz>>8)&0xFF]);

    return new Uint8Array([...lead, ...addon, ...coding]);

}

export function unpack_data(cipher: byte_array): [unicode_string[], number, byte_array] {

    const [dl, dh, al, ah] = cipher.slice(0, 4);
    const dict_sz = (dh << 8) | dl;
    const addon_sz = (ah << 8) | al;

    const addon = cipher.slice(4, 4 + addon_sz);
    const additions = new TextDecoder().decode(addon).split('\x00');

    const coding = cipher.slice(4 + addon_sz);

    return [additions, dict_sz, coding];

}


function test() {
    const words = ["what", "is", "up"];
    const packed = pack_data(words, 241, new Uint8Array([1, 2, 3]));
    console.log(packed);
    const unpacked = unpack_data(packed);
    console.log(unpacked);
}

if (import.meta.main) {
    test();
}
