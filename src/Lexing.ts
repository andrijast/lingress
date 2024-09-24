import type { unicode_string } from "./Utility";
import { HuffmanTree } from "./HuffmanTree";

export type token_data = {
    word: unicode_string,
    cap?: boolean, // capitalized
    acap?: boolean, // all caps
};

const hm = new HuffmanTree();

function splits(str: unicode_string): token_data[] {
    if (str === "") return [];
    for (let i = str.length; i > 0; i--) {
        const word = str.slice(0, i);
        const norm = word.toLowerCase();
        if (!hm.check(norm)) continue;
        if (word === norm)
            return [{word: norm}, ...splits(str.slice(i))]
        if (word === norm.charAt(0).toUpperCase() + norm.slice(1))
            return [{word: norm, cap: true}, ...splits(str.slice(i))]
        if (word === norm.toUpperCase())
            return [{word: norm, acap: true}, ...splits(str.slice(i))]
    }
    return [{word: str}];
}

export function tokenize(text: unicode_string): token_data[] {

    let ret: token_data[] = []

    const all = text.split(' ');
    let first = true;

    for (const str of all) {

        if (!first) ret.push({word: " "});
        first = false;

        ret = [...ret, ...splits(str)];
    }

    return ret;
}


export function stylize(tokens: token_data[]): unicode_string {

    let ret = "";
    for (const token of tokens) {
        let word = token.word
        if (token.cap) word = word.charAt(0).toUpperCase() + word.slice(1);
        if (token.acap) word = word.toUpperCase();
        ret += word
    }

    return ret;
}

