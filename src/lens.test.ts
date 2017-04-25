import { expect } from 'chai'
import 'mocha'

import { Lens, lens, lenses } from './lens'

type Inner = {
  foo: string,
  bar: number
}

type Outer = {
  inner: Inner
}

describe('core lens methods', () => {
  const foo = lens<Inner, string>
    (data => data.foo)
    (foo  => data => Object.assign({}, data, { foo }));

  const bar = lens<Inner, number>
    (data => data.bar)
    (bar  => data => Object.assign({}, data, { bar }));

  const data = { foo: 'abc', bar: 123 }

  it('get should get values', () => {
    expect(foo.get(data)).to.equal('abc')
    expect(bar.get(data)).to.equal(123)
  })

  it('set should set values', () => {
    expect(foo.set('cba')(data)).to.deep.equal({ foo: 'cba', bar: 123 })
    expect(bar.set(321)(data)).to.deep.equal({ foo: 'abc', bar: 321 })
  })

  it('modify should modify values', () => {
    expect(foo.modify(str => str + '!')(data)).to.deep.equal({ foo: 'abc!', bar: 123 })
    expect(bar.modify(num => num + 1)(data)).to.deep.equal({ foo: 'abc', bar: 124 })
  })
})

describe('prop lens', () => {
  const foo = lenses<Inner>().prop("foo")
  const bar = lenses<Inner>().prop("bar")

  const data = { foo: 'abc', bar: 123 }

  it('get should get values', () => {
    expect(foo.get(data)).to.equal('abc')
    expect(bar.get(data)).to.equal(123)
  })

  it('set should set values', () => {
    expect(foo.set('cba')(data)).to.deep.equal({ foo: 'cba', bar: 123 })
    expect(bar.set(321)(data)).to.deep.equal({ foo: 'abc', bar: 321 })
  })

  it('modify should modify values', () => {
    expect(foo.modify(str => str + '!')(data)).to.deep.equal({ foo: 'abc!', bar: 123 })
    expect(bar.modify(num => num + 1)(data)).to.deep.equal({ foo: 'abc', bar: 124 })
  })
})

describe('lenses method', () => {
  const lens = lenses<Outer>().prop("inner").prop("foo")

  const data = { inner: { foo: 'abc', bar: 123 } }

  it('get should get values', () => {
    expect(lens.get(data)).to.equal('abc')
  })

  it('set should set values', () => {
    expect(lens.set('cba')(data)).to.deep.equal({ inner: { foo: 'cba', bar: 123 } })
  })

  it('modify should modify values', () => {
    expect(lens.modify(str => str + '!')(data)).to.deep.equal({ inner: { foo: 'abc!', bar: 123 } })
  })
})
