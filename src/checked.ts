import { Messages } from './message'

export interface Checked<A> {
  map<B>(func: (value: A) => B): Checked<B>

  leftMap(func: (messages: Messages) => Messages): Checked<A>

  flatMap<B>(func: (value: A) => Checked<B>): Checked<B>

  fold<B>(l: (messages: Messages) => B, b: (messages: Messages, value: A) => B, r: (value: A) => B): B
}

export class Left<A> implements Checked<A> {
  readonly messages: Messages

  constructor(messages: Messages) {
    this.messages = messages
  }

  map<B>(func: (value: A) => B): Checked<B> {
    return new Left<B>(this.messages)
  }

  leftMap<B>(func: (messages: Messages) => Messages): Checked<B> {
    return new Left<B>(func(this.messages))
  }

  flatMap<B>(func: (value: A) => Checked<B>): Checked<B> {
    return new Left<B>(this.messages)
  }

  fold<B>(l: (messages: Messages) => B, b: (messages: Messages, value: A) => B, r: (value: A) => B): B {
    return l(this.messages)
  }
}

export class Both<A> implements Checked<A> {
  readonly messages: Messages
  readonly value: A

  constructor(messages: Messages, value: A) {
    this.messages = messages
    this.value    = value
  }

  map<B>(func: (value: A) => B): Checked<B> {
    return new Both(this.messages, func(this.value))
  }

  leftMap(func: (messages: Messages) => Messages): Checked<A> {
    return new Both(func(this.messages), this.value)
  }

  flatMap<B>(func: (value: A) => Checked<B>): Checked<B> {
    return func(this.value).fold<Checked<B>>(
      (m)    => new Left<B>(this.messages.concat(m)),
      (m, v) => new Both<B>(this.messages.concat(m), v),
      (v)    => new Both<B>(this.messages, v)
    )
  }

  fold<B>(l: (messages: Messages) => B, b: (messages: Messages, value: A) => B, r: (value: A) => B): B {
    return b(this.messages, this.value)
  }
}

export class Right<A> implements Checked<A> {
  readonly value: A

  constructor(value: A) {
    this.value = value
  }

  map<B>(func: (value: A) => B): Checked<B> {
    return new Right(func(this.value))
  }

  leftMap(func: (messages: Messages) => Messages): Checked<A> {
    return this
  }

  flatMap<B>(func: (value: A) => Checked<B>): Checked<B> {
    return func(this.value)
  }

  fold<B>(l: (messages: Messages) => B, b: (messages: Messages, value: A) => B, r: (value: A) => B): B {
    return r(this.value)
  }
}

export function left<A>(messages: Messages): Checked<A> {
  return new Left<A>(messages)
}

export function both<A>(messages: Messages, value: A): Checked<A> {
  return new Both<A>(messages, value)
}

export function right<A>(value: A): Checked<A> {
  return new Right<A>(value)
}

export function sequence<A>(arg: Array<Checked<A>>): Checked<Array<A>> {
  const reduce = (memo: Checked<Array<A>>, item: Checked<A>): Checked<Array<A>> =>
    memo.flatMap(array => item.map(value => array.concat([ value ])))

  // The array.reduce() method doesn't appear to support
  // reducers with different argument and return types.

  let memo = right<Array<A>>([])
  arg.forEach(item => memo = reduce(memo, item))

  return memo
}
