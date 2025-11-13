
// trueリテラル、falseリテラル、条件演算子、数値リテラル、足し算など単純な処理のみ扱える言語仕様

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
  }
}