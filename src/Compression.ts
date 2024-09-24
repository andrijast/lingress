import type { byte_array, dict_entry, unicode_string } from "./Utility";
import { BinaryStream, debug } from "./Utility";
import { pack_data, unpack_data } from "./Format";
import { tokenize, stylize, type token_data } from "./Lexing";
import { HuffmanTree, full_dict, combineDicts } from "./HuffmanTree";

const headers = new Map<string, string>([
    ["0", "normal"],
    ["10", "cap"],
    ["110", "acap"],
    ["111", "done"],
]);

function encode_header(word: token_data): string {
    if (word.cap) return "10";
    if (word.acap) return "110";
    else return "0";
}

function decode_header(bs: BinaryStream): token_data | null {
    let path = "";
    while (true) {
        const x = bs.take();
        if (!x) return null;
        path += x;
        if (headers.has(path)) break;
    }
    let ret = {word: "---"}; // placeholder
    switch (headers.get(path)) {
        case "normal": return ret;
        case "cap": return {...ret, cap: true};
        case "acap": return {...ret, acap: true};
        default: return null;
    }
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
        if (!which) break;
        const word = hm.decode(bs);
        if (!word) throw new Error("decoding error: huffman decode");
        tokens.push({...which, word: word});
    }

    const ret = stylize(tokens);

    return ret;


}


