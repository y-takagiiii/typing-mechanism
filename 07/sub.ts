import { error, parseSub } from "tiny-ts-parser";

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
  | { tag: "objectNew"; props: PropertyTerm[] }
  | { tag: "objectGet"; obj: Term; propName: string };

type Type =
  | { tag: "Boolean" }
  | { tag: "Number" }
  | { tag: "Func"; params: Param[]; retType: Type }
  | { tag: "Object"; props: PropertyType[] };

type Param = { name: string; type: Type };

type TypeEnv = Record<string, Type>;

type PropertyTerm = { name: string; term: Term };

type PropertyType = { name: string; type: Type };

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
        // 
        if (!subtype(argTy, funcTy.params[i].type)) {
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
    case "objectNew": {
      const props = t.props.map((prop) => ({
        name: prop.name, type: typecheck(prop.term, tyEnv)
      }));
      return { tag: "Object", props };
    }
    case "objectGet": {
      const objectTy = typecheck(t.obj, tyEnv);
      if (objectTy.tag !== "Object") error("object type expected", t.obj);
      const prop = objectTy.props.find((prop) => prop.name === t.propName);
      if (!prop) error(`unknown property name: ${t.propName}`, t);
      return prop.type;
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
    case "Object": {
      if (ty1.tag !== "Object") return false;
      if (ty1.props.length !== ty2.props.length) return false;
      for (const prop2 of ty2.props) {
        const prop1 = ty1.props.find((prop1) => prop1.name === prop2.name);
        if (!prop1) return false;
        if (!typeEq(prop1.type, prop2.type)) return false;
      }
      return true;
    }
  }
}

// 2つの型が部分型であるかどうかを判定する
// ty1がty2の部分型であればtrue、ty1がty2の部分型でなければfalseを返す
function subtype(ty1: Type, ty2: Type): boolean {
  switch (ty2.tag) {
    case "Boolean":
      return ty1.tag === "Boolean";
    case "Number":
      return ty1.tag === "Number";
    case "Object": {
      if (ty1.tag !== "Object") return false;
      // ty2の全てのプロパティをty1が持っているか(プロパティ名の)チェック
      for (const prop2 of ty2.props) {
        const prop1 = ty1.props.find((prop1) => prop1.name === prop2.name);
        if (!prop1) return false;
        // そのプロパティの値の型が部分型か(共変であるか)チェック
        if (!subtype(prop1.type, prop2.type)) return false;
      }
      return true;
    }
    case "Func": {
      if (ty1.tag !== "Func") return false;
      // 仮引数と実引数の数が一致しているかチェック 3.1.2
      if (ty1.params.length !== ty2.params.length) return false;
      // **ty2**の仮引数がty1の仮引数の部分型かチェック(※反変)
      for (let i = 0; i < ty1.params.length; i++) {
        if (!subtype(ty2.params[i].type, ty1.params[i].type)) {
          return false;
        }
      }
      // ty1の返り値の型がty2の返り値の型の部分型かチェック(※共変)
      if (!subtype(ty1.retType, ty2.retType)) return false;
      return true;
    }
  }
}

// console.dir(parseSub(`
//   const f = (x: { foo: number }) => x.foo;
//   const x = { foo: 1, bar: true };
//   f(x);
// `), { depth: null });

console.log(typecheck(parseSub(`
  const f = (x: { foo: number }) => x.foo;
  const x = { foo: 1, bar: true };
  f(x);
`), {}));

// 部分型でなければエラー
// console.log(typecheck(parseSub(`
//   type F = () => { foo: number; bar: boolean };
//   const f = (x: F) => x().bar;
//   const g = () => ({ foo: 1 });
//   f(g);
// `), {}));
