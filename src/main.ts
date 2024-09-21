import type { byte_array, unicode_string } from "./utility";
import { BinaryStream } from "./utility";
import { pack_data, unpack_data } from "./Format";
import { tokenize, stylize } from "./Lexing";
import { HuffmanTree } from "./HuffmanTree";


export function encode(text: unicode_string): byte_array {

    const words = tokenize(text);

    let dict = full_dict.slice(0, 65535)

    const hm1 = new HuffmanTree(dict);
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

    dict = full_dict.slice(0, max_rank);
    [...additions].forEach(word => {
        dict.push({word: word, freq: 1_000_000})
    })
    // console.log(dict)
    // console.log(additions)

    // max_rank = Math.min(max_rank, 65535);

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

    let dict = full_dict.slice(0, dict_sz);
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

const full_dict_string = await Bun.file("./dictionary/unigram_freq.csv").text();
const full_dict_array = full_dict_string.split('\n').slice(1, -1);
const full_dict = full_dict_array.map(x => x.split(',')).map(x => ({word: x[0], freq: +x[1]}))


async function run(input: unicode_string) {

    const org_sz = new Blob([input]).size
    console.log(`original size: ${org_sz}`)

    const com = encode(input)
    const com_sz = com.length
    console.log(`compressed size: ${com_sz}`)

    const ratio = (org_sz - com_sz) / org_sz * 100
    console.log(`compression ration: ${ratio.toFixed(2)}%`)

    const dec = decode(com)
    // console.log("Preview:")
    // console.log(dec)

    // await Bun.write("./examples/out.txt", dec ?? "");

}

run(await Bun.file("./samples/enwik5.txt").text());


