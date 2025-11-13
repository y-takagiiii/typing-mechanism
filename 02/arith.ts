
// trueリテラル、falseリテラル、条件演算子、数値リテラル、足し算など単純な処理のみ扱える言語仕様

import { parseArith } from "tiny-ts-parser";

// 言語仕様を構文木で表現
// true、false、数値は葉ノード
// 足し算は左右に子ノードを持つaddノード
// 条件演算子は条件式(cond)、then節(thn)、else節(els)の3子ノードを持つifノード

// 構文木を02/ast.jsonのようなデータ構造として表現

// データ構造を型に落とし込む
type Term =
  | { tag: "true" }
  | { tag: "false" }
  | { tag: "number"; n: number }
  | { tag: "if"; cond: Term; thn: Term; els: Term }
  | { tag: "add"; left: Term; right: Term };

// 型の内部表現
type Type =
  | { tag: "Boolean" }
  | { tag: "Number" };

// 項(Term)を受け取ってその型を返す関数
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
      // 条件式がbooleanかチェック
      const condType = typecheck(t.cond);
      if (condType.tag !== "Boolean") throw "boolean expected"
      // 条件演算子の返す型が一致するかチェック
      const thnType = typecheck(t.thn);
      const elsType = typecheck(t.els);
      if (thnType.tag !== elsType.tag) {
        throw "then and else have different types"
      }
      return thnType;
    }
  }
}

console.log(typecheck(parseArith("true ? 2 : 3")));
