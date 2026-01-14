// 型Aが型Bの部分型なら、型{ foo: A }は型{ foo: B }の部分型としてよい
type Obj1 = { foo: { bar: number } };
type Obj2 = { foo: { bar: number, baz: boolean } };
const f1 = (x: Obj1) => x.foo.bar;
const f2 = (x: Obj2) => x.foo.baz;
const y1: Obj1 = { foo: { bar: 1 } };
const y2: Obj2 = { foo: { bar: 1, baz: true } };
const result1 = f1(y2);
// const result2 = f2(y1) // Obj1はObj2の部分型である場合、Obj2を引数とする関数に対してObj1を渡すと問題になる

console.log(result1)