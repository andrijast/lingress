import type { byte_array, dict_entry, unicode_string } from "./utility";
import { BinaryStream, debug } from "./utility";
import { pack_data, unpack_data } from "./Format";
import { tokenize, stylize, type token_data } from "./Lexing";
import { HuffmanTree, full_dict, combineDicts } from "./HuffmanTree";

function encode_header(word: token_data): string {
    if (word.cap) return "10";
    if (word.acap) return "11";
    else return "0";
}

function decode_header(bs: BinaryStream): token_data | null {
    let ret = {word: "----"};
    let x;
    x = bs.take(); if (!x) return null;
    if (x === "0") return ret;
    x = bs.take(); if (!x) return null;
    if (x === "0") return {...ret, cap: true};
    if (x === "1") return {...ret, acap: true};
    return null;
}

export function encode(text: unicode_string): byte_array {

    // tokenization
    const tokens = tokenize(text);
    debug("tokens", tokens.map(tok => tok.word));
    debug("tokens_full", tokens.slice(0, 1000));

    // collecting additions
    const hm1 = new HuffmanTree();
    const additions_set = new Set<string>();
    let max_rank = 0;
    for (const token of tokens) {
        const rank = hm1.check(token.word);
        if (!rank) {
            additions_set.add(token.word);
        } else {
            max_rank = Math.max(max_rank, rank);
        }
    }
    const additions = [...additions_set];

    // max_rank and appendix
    max_rank = Math.min(max_rank, 65535);
    const appendix: dict_entry[] = [];
    additions.forEach(word => {
        appendix.push({word: word, freq: 1_000_000})
    })
    const dict = combineDicts(full_dict.slice(0, max_rank), appendix);

    debug("max_rank", max_rank);
    debug("additions", additions);


    // constructing coding sequence
    const hm2 = new HuffmanTree(dict);
    const ret = new BinaryStream();
    for (const word of tokens) {
        const head = encode_header(word);
        const code = hm2.encode(word.word)
        if (!code) throw new Error(`what happened?? ${word}`);
        ret.appendString(head)
        ret.appendString(code)
    }

    // pack up
    return pack_data(additions, max_rank, ret.toBytes());
}

export function decode(cipher: byte_array): unicode_string {

    const [additions, dict_sz, coding] = unpack_data(cipher);

    const dict = full_dict.slice(0, dict_sz);
    additions.forEach(word => {
        dict.push({word: word, freq: 1_000_000})
    });

    const hm = new HuffmanTree(dict);

    const tokens: token_data[] = [];

    const bs = new BinaryStream(coding);

    while (true) {
        const which = decode_header(bs);
        const word = hm.decode(bs);
        if (!which || !word) {
            if (bs.take() !== null) throw new Error("decoding error: huffman decode");
            else break; // either empty or padding bits
        }
        tokens.push({...which, word: word});
    }

    const ret = stylize(tokens);

    return ret;


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

    console.log("correctness:", dec === input);

}

run(await Bun.file("./samples/enwik5.txt").text());


