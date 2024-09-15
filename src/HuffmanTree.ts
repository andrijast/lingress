import { SortedMap } from "@rimbu/sorted";
import { BinaryStream } from "./BinaryStream";

export interface IHuffmanTree {
    encode(str: string): string | null;
    decode(bs: BinaryStream): (string | null)[];
}

class Node {

    word: string | null
    freq: number
    rank?: number
    path: string = ""

    left: Node | null = null;
    right: Node | null = null;

    constructor(data: {word: string | null, freq: number}, rank?: number) {
        this.freq = data.freq
        this.word = data.word
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
            if (val)
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

    constructor(data: {word: string, freq: number}[]) {

        this.map = SortedMap.from([])

        let rank = 1;
        for (const x of data) {
            // if (rank > 65000) break;
            const node = new Node(x, rank++)
            this.pushNode(node)
        }

        this.construct()
        // console.log(this.root)

        this.traverse()
        // console.log(this.code.get("motherfucker"))

    }

    private construct() {
        while (this.map.size >= 2) {

            const left = this.popNode()
            const right = this.popNode()

            if (!left || !right) return;

            const node = new Node({word: null, freq: left.freq + right.freq})
            node.left = left;
            node.right = right;

            this.pushNode(node)

        }
        this.root = this.popNode()
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

    public decode(bs: BinaryStream): string[] {
        const ret = []
        let node: Node = this.root as Node;
        while (true) {
            const c = bs.take()
            if (c === null) break;
            if (!node.left || !node.right) throw new Error("should not happen");
            if (c === "0") node = node.left;
            else if (c === "1") node = node.right;
            if (node.word) {
                ret.push(node.word);
                if (!this.root) throw new Error("should not happen");
                node = this.root;
            }
        }
        return ret;
    }


}

