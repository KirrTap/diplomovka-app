import { describe, it, expect } from 'vitest'
import { replaceShortcutsRealtime } from '../src/utils/logicInputShortcuts'

describe('replaceShortcutsRealtime', () => {
  it('replaces \\and with ∧', () => {
    expect(replaceShortcutsRealtime('A \\and B')).toEqual('A ∧ B')
  })
  it('replaces \\land with ∧', () => {
    expect(replaceShortcutsRealtime('A \\land B')).toEqual('A ∧ B')
  })
  it('replaces \\& with ∧', () => {
    expect(replaceShortcutsRealtime('A \\& B')).toEqual('A ∧ B')
  })

  it('replaces \\lor with ∨', () => {
    expect(replaceShortcutsRealtime('A \\lor B')).toEqual('A ∨ B')
  })
  it('replaces \\or with ∨', () => {
    expect(replaceShortcutsRealtime('A \\or B')).toEqual('A ∨ B')
  })
  it('replaces \\| with ∨', () => {
    expect(replaceShortcutsRealtime('A \\| B')).toEqual('A ∨ B')
  })

  it('replaces \\implies with =>', () => {
    expect(replaceShortcutsRealtime('A \\implies B')).toEqual('A => B')
  })
  it('replaces \\rightarrow with =>', () => {
    expect(replaceShortcutsRealtime('A \\rightarrow B')).toEqual('A => B')
  })
  it('replaces \\to with =>', () => {
    expect(replaceShortcutsRealtime('A \\to B')).toEqual('A => B')
  })

  it('replaces \\neg with ¬', () => {
    expect(replaceShortcutsRealtime('¬P \\neg Q')).toEqual('¬P ¬ Q')
  })
  it('replaces \\not with ¬', () => {
    expect(replaceShortcutsRealtime('A \\not B')).toEqual('A ¬ B')
  })
  it('replaces \\! with ¬', () => {
    expect(replaceShortcutsRealtime('A \\! B')).toEqual('A ¬ B')
  })

  it('replaces \\vdash with ⊢', () => {
    expect(replaceShortcutsRealtime('A \\vdash B')).toEqual('A ⊢ B')
  })

  it('replaces \\forall with ∀', () => {
    expect(replaceShortcutsRealtime('\\forallx')).toEqual('∀x')
  })
  it('replaces \\exists with ∃', () => {
    expect(replaceShortcutsRealtime('\\existsx')).toEqual('∃x')
  })

  it('no replaces', () => {
    expect(replaceShortcutsRealtime('P Q R')).toEqual('P Q R')
  })

  it('multiple shortcuts', () => {
    expect(replaceShortcutsRealtime('(\\forallx) (\\existsy) ((P(x) \\implies \\negQ(x)) \\vdash R(y))')).toEqual('(∀x) (∃y) ((P(x) => ¬Q(x)) ⊢ R(y))')
  })
})
