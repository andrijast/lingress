import { SortedMap } from "@rimbu/sorted";
import { BinaryStream, type dict_entry } from "./Utility";

export interface IHuffmanTree {
    encode(str: string): string | null;
    decode(bs: BinaryStream): string | null;
}

class Node {

    word: string | null
    freq: number
    rank?: number
    path: string = ""

    left: Node | null = null;
    right: Node | null = null;

    constructor(word: string | null, freq: number, rank?: number) {
        this.freq = freq
        this.word = word
        this.rank = rank
    }
}

export class HuffmanTree implements IHuffmanTree {

    map: SortedMap<number, Node[]>
    root: Node | null = null
    code: Map<string, Node> = new Map()

    private pushNode(node: Node) {
        if (this.map.hasKey(node.freq)) {
            const val = this.map.get(node.freq);
            if (!val) throw new Error("what the fuck?")
            val.push(node);
        } else {
            this.map = this.map.addEntry([node.freq, [node]])
        }
    }

    private popNode(): Node | null {
        if (!this.map.nonEmpty()) return null
        const minkey = this.map.minKey()
        const res = this.map.get(minkey)
        if (!res) throw new Error("WHATAFAK!");
        const node = res.pop()
        if (!node) throw new Error(`WHATAFAK2!, ${res.length}`);
        if (res.length === 0) this.map = this.map.removeKey(minkey)
        return node;
    }

    constructor(data?: dict_entry[]) {

        data = data ?? full_dict.slice(0, 65535);

        this.map = SortedMap.from([])

        let rank = 1;
        for (const x of data) {
            // if (rank > 65000) break;
            const node = new Node(x.word, x.freq, rank++)
            this.pushNode(node)
        }

        this.construct()
        // console.log(this.root)

        this.traverse()
        // console.log(this.code.get("motherfucker"))

    }

    private construct() {
        while (true) {

            const left = this.popNode()
            const right = this.popNode()

            if (!right || !left) {
                if (!left) throw new Error("should not happen");
                this.root = left
                return;
            }

            const node = new Node(null, left.freq + right.freq)
            node.left = left;
            node.right = right;

            this.pushNode(node)

        }
    }


    private traverse(node: Node = this.root as Node, path: string = "") {
        if (node.word !== null) {
            node.path = path
            this.code.set(node.word, node)
            return;
        }
        if (!node.left || !node.right) throw new Error("BAD GATEWAY!");
        this.traverse(node.left, path + "0")
        this.traverse(node.right, path + "1")
    }

    public encode(word: string): string | null {
        const node = this.code.get(word);
        if (!node) return null;
        return node.path;
    }

    public check(word: string): null | number {
        const node = this.code.get(word);
        if (!node) return null;
        return node.rank ?? null;
    }

    public decode(bs: BinaryStream): string | null {
        if (!this.root) throw new Error("should not happen");
        let node: Node = this.root;
        while (true) {
            const c = bs.take()
            if (c === null) return null;
            if (!node.left || !node.right) throw new Error("should not happen");
            if (c === "0") node = node.left;
            else if (c === "1") node = node.right;
            if (node.word) {
                return node.word;
            }
        }
    }
}

export function combineDicts(first: dict_entry[], second: dict_entry[]): dict_entry[] {
    const both = [...first, ...second];
    both.sort((a, b) => b.freq - a.freq);
    return both;
}

export async function getBaseDict(): Promise<dict_entry[]> {
    const words = (await Bun.file("./dictionary/dict_words.csv").text()).split('\n').slice(1, -1);
    const contractions = (await Bun.file("./dictionary/dict_contractions.csv").text()).split('\n').slice(1, -1);
    const ascii = (await Bun.file("./dictionary/dict_ascii.csv").text()).split('\n').slice(1, -1);
    const more_ascii = [{word: ",", freq: 1000000000}, {word: "\n", freq: 1000000000}]

    return combineDicts(
        combineDicts(
            words.map(x => x.split(',')).map(x => ({word: x[0], freq: +x[1]})),
            contractions.map(x => x.split(',')).map(x => ({word: x[0], freq: +x[1]}))
        ),
        combineDicts(
            ascii.map(x => x.split(',')).map(x => ({word: x[0], freq: +x[1]})),
            more_ascii
        )
    )
}

export const full_dict = await getBaseDict();

