import type { byte_array, dict_entry, unicode_string } from "./utility";
import { BinaryStream, debug } from "./utility";
import { pack_data, unpack_data } from "./Format";
import { tokenize, stylize } from "./Lexing";
import { HuffmanTree, full_dict, combineDicts } from "./HuffmanTree";


export function encode(text: unicode_string): byte_array {

    const words = tokenize(text);

    const hm1 = new HuffmanTree();
    const additions = new Set<string>();
    let max_rank = 0;
    for (const word of words) {
        const rank = hm1.check(word);
        if (!rank) {
            additions.add(word);
        } else {
            max_rank = Math.max(max_rank, rank);
        }
    }

    const appendix: dict_entry[] = [];
    [...additions].forEach(word => {
        appendix.push({word: word, freq: 1_000_000})
    })
    const dict = combineDicts(full_dict.slice(0, max_rank), appendix);
    // console.log(additions)

    max_rank = Math.min(max_rank, 65535);

    const hm2 = new HuffmanTree(dict);
    const ret = new BinaryStream();

    for (const word of words) {
        const code = hm2.encode(word)
        if (code)
            ret.appendString(code)
        else throw new Error(`what happened?? ${word}`)
    }

    // console.log(additions);
    // console.log(max_rank);

    return pack_data([...additions], max_rank, ret.toBytes());
}

function decode_header(bs: BinaryStream): number {
    return 0;
}

export function decode(cipher: byte_array): unicode_string | null {

    const [additions, dict_sz, coding] = unpack_data(cipher);

    const dict = full_dict.slice(0, dict_sz);
    additions.forEach(word => {
        dict.push({word: word, freq: 1_000_000})
    });

    const hm = new HuffmanTree(dict);

    const words: unicode_string[] = [];

    try {

        const bs = new BinaryStream(coding);
        const which = decode_header(bs);
        switch (which) {
            case 0: {
                const word = hm.decode(bs);
                if (word)
                    words.push(word);
            }
        }
        const ret = stylize(words);

        return ret;

    } catch (err) {

        console.log("DECODING FAILED!");
        return null;

    }


}


async function run(input: unicode_string) {

    const org_sz = new Blob([input]).size
    console.log(`original size: ${org_sz}`)

    const enc = encode(input)
    const enc_sz = enc.length
    console.log(`compressed size: ${enc_sz}`)

    const ratio = (org_sz - enc_sz) / org_sz * 100
    console.log(`compression ratio: ${ratio.toFixed(2)}%`)

    const dec = decode(enc)
    const dec_sz = new Blob([dec]).size
    console.log(`decompressed size: ${dec_sz}`)
    debug("decompressed", dec);

}

run(await Bun.file("./samples/enwik5.txt").text());


