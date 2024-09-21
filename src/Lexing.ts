import type { unicode_string } from "./utility";

function normalize(word: unicode_string): unicode_string {
    return word.toLowerCase();
}

export function tokenize(text: unicode_string): unicode_string[] {

    return text.split(' ')
            //    .map(x => normalize(x))
               .filter(x => x != "")

}


export function stylize(words: unicode_string[]): unicode_string {

    return words.join(' ');
}

