import { parseArgs } from "util";
import { encode, decode } from "./Compression"
import { debug, type byte_array, type unicode_string } from "./Utility"

async function benchmark() {

    const input = await Bun.file(`./samples/enwik5.txt`).text();

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

const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
        compress: { type: 'boolean', short: 'c' }, // default one
        decompress: { type: 'boolean', short: 'd' },
        output: { type: 'string', short: 'o' }, // destination file
        base64: { type: 'boolean', short: 'b' }, // compressed data in base64
        dev: { type: 'boolean' } // benchmarking
    },
    strict: true,
    allowPositionals: true,
});
// console.log(values, positionals);

async function main() {

    if (values.dev) {
        await benchmark();
        return;
    }

    if (positionals.length < 3) {
        throw new Error("Input file not provided!");
    }

    const input_path = positionals[2];
    const compress = values.compress ?? !(values.decompress ?? false);
    const output_path = values.output ?? input_path + (compress ? '.lss' : '.txt');

    const input_file = Bun.file(input_path);
    if (!input_file.exists()) throw new Error("File does not exist");
    let input: unicode_string | byte_array = await input_file.bytes();
    let output: unicode_string | byte_array;

    if (compress) {
        input = new TextDecoder().decode(input);
        output = encode(input);
        if (values.base64)
            output = btoa(Array.from(output, x => String.fromCharCode(x)).join(''));
    }

    else {
        if (values.base64)
            input = Uint8Array.from(atob(new TextDecoder().decode(input)).split('').map(x => x.charCodeAt(0)));
        output = decode(input);
    }

    Bun.write(output_path, output);
}

main();

