import { parseArith, parseBasic } from "tiny-ts-parser";

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

// 変数が現在どういう型を持っているかを管理する
type TypeEnv = Record<string, Type>;

function typecheck(t: Term, tyEnv: TypeEnv): Type {
  switch (t.tag) {
    case "true":
      return { tag: "Boolean" }
    case "false":
      return { tag: "Boolean" }
    case "number":
      return { tag: "Number" }
    case "add": {
      const leftType = typecheck(t.left, tyEnv);
      if (leftType.tag !== "Number") throw "number expected";
      const rightType = typecheck(t.right, tyEnv);
      if (rightType.tag !== "Number") throw "number expected";
      return { tag: "Number" };
    }
    case "if": {
      const condType = typecheck(t.cond, tyEnv);
      if (condType.tag !== "Boolean") throw "boolean expected"
      const thnType = typecheck(t.thn, tyEnv);
      const elsType = typecheck(t.els, tyEnv);
      if (thnType.tag !== elsType.tag) {
        throw "then and else have different types"
      }
      return thnType;
    }
    case "var":
      if (tyEnv[t.name] === undefined)
        throw new Error(`unknown variable: ${t.name}`);
      return tyEnv[t.name];
    case "func":
      const retType = typecheck(t.body, tyEnv);
      return { tag: "Func", params: t.params, retType };
    default:
      throw new Error("not implemented yet")
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

console.log(typecheck(parseBasic("(x: boolean) => 42"), {}));
console.log(typecheck(parseBasic("(x: number) => x"), {}));
