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

// 型の等価判定をする関数
function typeEq(ty1: Type, ty2: Type): boolean {
  switch (ty2.tag) {
    case "Boolean":
      return ty1.tag === "Boolean";
    case "Number":
      return ty1.tag === "Number";
    // 関数の等価判定は1.仮引数の個数が同じ、2.仮引数の型が同じ、3.返り値の方が同じ
    case "Func": {
      if (ty1.tag !== "Func") return false;
      if (ty1.params.length !== ty2.params.length) return false;
      for (let i = 0; i < ty1.params.length; i++) {
        if (!typeEq(ty1.params[i].type, ty2.params[i].type)) return false;
      }
      if (!typeEq(ty1.retType, ty2.retType)) return false;
      return true;
    }
  }
}

console.log(typecheck(parseArith("1 ? true : false"))); // => { tag: "Boolean" }
