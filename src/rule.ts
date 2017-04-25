import { Segment } from './path'
import { Messages, error, warning, prefixMessage } from './message'
import { Checked, left, both, right, sequence } from './checked'
import { PLens } from './lens'

export class Rule<A, B> {
  readonly check: (arg: A) => Checked<B>

  constructor(check: (arg: A) => Checked<B>) {
    this.check = check
  }

  map<C>(func: (arg: B) => C): Rule<A, C> {
    return new Rule<A, C>(arg => this.check(arg).map(func))
  }

  contramap<C>(func: (arg: C) => A): Rule<C, B> {
    return new Rule<C, B>(arg => this.check(func(arg)))
  }

  flatMap<C>(func: (arg: B) => Rule<A, C>): Rule<A, C> {
    return new Rule<A, C>(arg => this.check(arg).flatMap(arg2 => func(arg2).check(arg)))
  }

  andThen<C>(that: Rule<B, C>): Rule<A, C> {
    return new Rule<A, C>(arg => this.check(arg).flatMap(arg2 => that.check(arg2)))
  }

  zip<C>(that: Rule<A, C>): Rule<A, [B, C]> {
    return new Rule<A, [B, C]>(a =>
      this.check(a).fold(
        msg1 => (
          that.check(a).fold(
            msg2      => left(msg1.concat(msg2)),
            (msg2, c) => left(msg1.concat(msg2)),
            c         => left(msg1)
          )
        ),
        (msg1, b) => (
          that.check(a).fold(
            msg2      => left(msg1.concat(msg2)),
            (msg2, c) => both(msg1.concat(msg2), [b, c]),
            c         => both(msg1, [b, c])
          )
        ),
        b => (
          that.check(a).fold(
            msg2      => left(msg2),
            (msg2, c) => both(msg2, [b, c]),
            c         => right(c)
          )
        )
      )
    )
  }

  prefix(seg: Segment): Rule<A, B> {
    return new Rule<A, B>(arg =>
      this.check(arg).leftMap(msgs =>
        msgs.map(msg =>
          prefixMessage(seg, msg)
        )
      )
    )
  }

  at<S, T>(lens: PLens<S, T, A, B>) {
    return (rule: Rule<A, B>): Rule<S, T> => {
      return new Rule<S, T>(s =>
        rule.check(lens.get(s)).map(b => lens.set(b)(s))
      )
    }
  }
}

// Base rules ---------------------------------

export const rule = <A, B>(func: (arg: A) => Checked<B>): Rule<A, B> => {
  return new Rule<A, B>(func)
}

export const pass = <A>(): Rule<A, A> => {
  return new Rule<A, A>(arg => right(arg))
}

export const fail = <A>(msg: string): Rule<A, A> => {
  return new Rule<A, A>(arg => both(error(msg), arg))
}

export const warn = <A>(msg: string): Rule<A, A> => {
  return new Rule<A, A>(arg => both(warning(msg), arg))
}

// Messages => (A => boolean) => Rule<A, A>
export const test = <A>(msgs: Messages) => {
  return (pred: (arg: A) => Boolean): Rule<A, A> => {
    return new Rule<A, A>(a => pred(a) ? right(a) : both(msgs, a))
  }
}

export const asInt = (messages: Messages = error("Must be a whole number")): Rule<string, number> => {
  const regex = /^[0-9]+$/g
  return new Rule<string, number>(str => {
    if(regex.test(str)) {
      return right(parseInt(str, 10))
    } else {
      return left(messages)
    }
  })
}

export const asFloat = (messages: Messages = error("Must be a number")): Rule<string, number> => {
  return new Rule<string, number>(str => {
    const num = parseFloat(str)
    if(isNaN(num)) {
      return left(messages)
    } else {
      return right(num)
    }
  })
}

export const trimString: Rule<string, string> =
  new Rule<string, string>(str =>
    right(str.trim())
  )

export const eql = <A>(value: A, msgs: Messages = error(`Must be ${value}`)): Rule<A, A> => {
  return test(msgs)(arg => arg === value)
}

export const neq = <A>(value: A, msgs: Messages = error(`Must not be ${value}`)): Rule<A, A> => {
  return test(msgs)(arg => arg !== value)
}

export const gt = <A>(value: A, msgs: Messages = error(`Must be greater than ${value}`)): Rule<A, A> => {
  return test(msgs)(arg => arg > value)
}

export const lt = <A>(value: A, msgs: Messages = error(`Must be less than ${value}`)): Rule<A, A> => {
  return test(msgs)(arg => arg < value)
}

export const gte = <A>(value: A, msgs: Messages = error(`Must be greater than or equal to ${value}`)): Rule<A, A> => {
  return test(msgs)(arg => arg >= value)
}

export const lte = <A>(value: A, msgs: Messages = error(`Must be less than or equal to ${value}`)): Rule<A, A> => {
  return test(msgs)(arg => arg <= value)
}

export const nonEmptyString = (msgs: Messages = error(`Must not be empty`)): Rule<string, string> => {
  return test<string>(msgs)(arg => arg.length > 0)
}

export const nonEmptyArray = <A>(msgs: Messages = error(`Must not be empty`)): Rule<Array<A>, Array<A>> => {
  return test<Array<A>>(msgs)(arg => arg.length > 0)
}

export const matches = (regExp: RegExp, msgs: Messages = error(`Must match the pattern ${regExp}`)): Rule<string, string> => {
  return test<string>(msgs)(arg => regExp.test(arg))
}

export const containedIn = <A>(values: Array<A>, msgs: Messages = error(`Must be one of the values: ${values.join(', ')}`)): Rule<A, A> => {
  return test<A>(msgs)(arg => values.indexOf(arg) >= 0)
}

export const notContainedIn = <A>(values: Array<A>, msgs: Messages = error(`Must not be one of the values: ${values.join(', ')}`)): Rule<A, A> => {
  return test<A>(msgs)(arg => values.indexOf(arg) < 0)
}

export const optional = <A, B>(rule: Rule<A, B>): Rule<A | null, B | null> => {
  return new Rule<A | null, B | null>(arg => arg == null ? right(null) : rule.check(arg))
}

export const required = <A, B>(rule: Rule<A, B>, msgs: Messages = error(`Value is required`)): Rule<A | null, B> => {
  return new Rule<A | null, B>(arg => arg == null ? left<B>(msgs) : rule.check(arg))
}

export const arrayOf = <A, B>(rule: Rule<A, B>): Rule<Array<A>, Array<B>> => {
  return new Rule<Array<A>, Array<B>>(arg => sequence(arg.map(a => rule.check(a))))
}
