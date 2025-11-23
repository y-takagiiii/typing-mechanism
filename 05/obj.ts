import { error, parseArith, parseBasic } from "tiny-ts-parser";

type Term =
  | { tag: "true" }
  | { tag: "false" }
  | { tag: "number"; n: number }
  | { tag: "if"; cond: Term; thn: Term; els: Term }
  | { tag: "add"; left: Term; right: Term }
  | { tag: "var"; name: string }
  | { tag: "func"; params: Param[]; body: Term }
  | { tag: "call"; func: Term; args: Term[] }
  | { tag: "seq"; body: Term; rest: Term }
  | { tag: "const"; name: string; init: Term; rest: Term }
  | { tag: "objectNew"; props: PropertyTerm[] } // オブジェクト生成の構文木
  | { tag: "objectGet"; obj: Term; propName: string }; // プロパティ呼び出しの構文木

type Type =
  | { tag: "Boolean" }
  | { tag: "Number" }
  | { tag: "Func"; params: Param[]; retType: Type }
  | { tag: "Object"; props: PropertyTerm[ ]}; // Object型を追加

type Param = { name: string; type: Type };

type TypeEnv = Record<string, Type>;

type PropertyTerm = { name: string; term: Term }; // オブジェクトのプロパティを表す型

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
      if (leftType.tag !== "Number") error("number expected", t.left);
      const rightType = typecheck(t.right, tyEnv);
      if (rightType.tag !== "Number") error("number expected", t.right);
      return { tag: "Number" };
    }
    case "if": {
      const condType = typecheck(t.cond, tyEnv);
      if (condType.tag !== "Boolean") error("boolean expected", t.cond);
      const thnType = typecheck(t.thn, tyEnv);
      const elsType = typecheck(t.els, tyEnv);
      if (thnType.tag !== elsType.tag) {
        error("then and else have different types", t)
      }
      return thnType;
    }
    case "var":
      if (tyEnv[t.name] === undefined)
        error(`unknown variable: ${t.name}`, t);
      return tyEnv[t.name];
    case "func":
      const newTyEnv = { ...tyEnv };
      for (const { name, type } of t.params) {
        newTyEnv[name] = type;
      }
      const retType = typecheck(t.body, newTyEnv);
      return { tag: "Func", params: t.params, retType };
    case "call": {
      const funcTy = typecheck(t.func, tyEnv);
      if (funcTy.tag !== "Func") error("function type expected", t.func);
      if (funcTy.params.length !== t.args.length) {
        error("wrong number of arguments", t);
      }
      for (let i = 0; i < t.args.length; i++) {
        const argTy = typecheck(t.args[i], tyEnv);
        if (!typeEq(argTy, funcTy.params[i].type)) {
          error("parameter type mismatch", t.args[i]);
        }
      }
      return funcTy.retType;
    }
    case "seq":
      typecheck(t.body, tyEnv);
      return typecheck(t.rest, tyEnv);
    case "const": {
      const ty = typecheck(t.init, tyEnv);
      const newTyEnv = { ...tyEnv, [t.name]: ty };
      return typecheck(t.rest, newTyEnv);
    }
  }
}

function typeEq(ty1: Type, ty2: Type): boolean {
  switch (ty2.tag) {
    case "Boolean":
      return ty1.tag === "Boolean";
    case "Number":
      return ty1.tag === "Number";
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

console.dir(typecheck(parseBasic(`
  const add = (x: number, y: number) => x + y;
  const select = (b: boolean, x: number, y: number) => b ? x : y;
  
  const x = add(1, add(2, 3));
  const y = select(true, x, x);

  y;
`), {}), {depth: null}, );

console.dir(typecheck(parseBasic(`
  const add = (x: number, y: number) => x + y;
  add(1, 2)
`), {}), {depth: null})

console.dir(typecheck(parseBasic(`
  const x = 3;
  const y = 4;
  const add = (x: number, y: number) => x + y;

  add(x, add(x, y))
`), {}), {depth: null})

