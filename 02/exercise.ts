// TypeScript と同じように、条件演算子の条件式が任意の型の値でも OK とするよう に arith.ts を改変
import { parseArith } from "tiny-ts-parser";

type Term =
  | { tag: "true" }
  | { tag: "false" }
  | { tag: "number"; n: number }
  | { tag: "if"; cond: Term; thn: Term; els: Term }
  | { tag: "add"; left: Term; right: Term };

type Type =
  | { tag: "Boolean" }
  | { tag: "Number" };

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
      const _ = typecheck(t.cond);
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
