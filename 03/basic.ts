import { parseArith } from "tiny-ts-parser";

type Term =
  | { tag: "true" }
  | { tag: "false" }
  | { tag: "number"; n: number }
  | { tag: "if"; cond: Term; thn: Term; els: Term }
  | { tag: "add"; left: Term; right: Term }
  | { tag: "var"; name: string }
  | { tag: "func"; params: Param[]; body: Term }
  | { tag: "call"; func: Term; args: Term[] }
  // | { tag: "seq"; body: Term; rest: Term }
  // | { tag: "const"; name: string; init: Term; rest: Term };

type Type =
  | { tag: "Boolean" }
  | { tag: "Number" }
  | { tag: "Func"; params: Param[]; retType: Type };

type Param = { name: string; type: Type };

function typecheck(t: Term): Type {
  switch (t.tag) {
    case "true":
      return { tag: "Boolean" }
    case "false":
      return { tag: "Boolean" }
    case "number":
      return { tag: "Number" }
    case "add": {
      const leftType = typecheck(t.left);
      if (leftType.tag !== "Number") throw "number expected";
      const rightType = typecheck(t.right);
      if (rightType.tag !== "Number") throw "number expected";
      return { tag: "Number" };
    }
    case "if": {
      const condType = typecheck(t.cond);
      if (condType.tag !== "Boolean") throw "boolean expected"
      const thnType = typecheck(t.thn);
      const elsType = typecheck(t.els);
      if (thnType.tag !== elsType.tag) {
        throw "then and else have different types"
      }
      return thnType;
    }
  }
}

console.log(typecheck(parseArith("1 ? true : false"))); // => { tag: "Boolean" }
