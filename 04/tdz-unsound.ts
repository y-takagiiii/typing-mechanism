// TSでは後方で定義される変数を参照可能(エラーにならない)
const f = () => x;
const x = 1;
console.log(f());