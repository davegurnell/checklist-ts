export class PLens<S, T, A, B> {
  get: (s: S) => A
  set: (b: B) => (s: S) => T

  constructor(get: (s: S) => A, set: (b: B) => (s: S) => T) {
    this.get = get
    this.set = set
  }

  modify(f: (a: A) => B) {
    return (s: S): T => {
      return this.set(f(this.get(s)))(s)
    }
  }
}

export class Lens<S, A> extends PLens<S, S, A, A> {
  prop<K extends keyof A>(field: K): Lens<S, A[K]> {
    return new Lens<S, A[K]>(
      s => this.get(s)[field],
      b => s => {
        var a = Object.assign({}, this.get(s))
        a[field] = b
        return this.set(a)(s)
      }
    )
  }
}

export const plens = <S, T, A, B>(getter: (s: S) => A) => {
  return (setter: (b: B) => (s: S) => T): PLens<S, T, A, B> => {
    return new PLens<S, T, A, B>(getter, setter)
  }
}

export const lens = <S, A>(getter: (s: S) => A) => {
  return (setter: (a: A) => (s: S) => S): Lens<S, A> => {
    return new Lens<S, A>(getter, setter)
  }
}

export class LensFactory<S> {
  prop<K extends keyof S>(field: K): Lens<S, S[K]> {
    return new Lens<S, S[K]>(
      s => s[field],
      a => s => {
        var ans = Object.assign({}, s)
        ans[field] = a
        return ans
      }
    )
  }
}

export function lenses<S>(): LensFactory<S> {
  return new LensFactory<S>()
}
