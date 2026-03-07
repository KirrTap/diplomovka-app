import { describe, it, expect } from 'vitest'
import { replaceShortcutsRealtime } from '../src/utils/logicInputShortcuts'

describe('replaceShortcutsRealtime', () => {
  it('replaces \\and with ∧', () => {
    expect(replaceShortcutsRealtime('A \\and B')).toBe('A ∧ B')
  })
  it('replaces \\land with ∧', () => {
    expect(replaceShortcutsRealtime('A \\land B')).toBe('A ∧ B')
  })
  it('replaces \\& with ∧', () => {
    expect(replaceShortcutsRealtime('A \\& B')).toBe('A ∧ B')
  })

  it('replaces \\lor with ∨', () => {
    expect(replaceShortcutsRealtime('A \\lor B')).toBe('A ∨ B')
  })
  it('replaces \\or with ∨', () => {
    expect(replaceShortcutsRealtime('A \\or B')).toBe('A ∨ B')
  })
  it('replaces \\| with ∨', () => {
    expect(replaceShortcutsRealtime('A \\| B')).toBe('A ∨ B')
  })

  it('replaces \\implies with =>', () => {
    expect(replaceShortcutsRealtime('A \\implies B')).toBe('A => B')
  })
  it('replaces \\rightarrow with =>', () => {
    expect(replaceShortcutsRealtime('A \\rightarrow B')).toBe('A => B')
  })
  it('replaces \\to with =>', () => {
    expect(replaceShortcutsRealtime('A \\to B')).toBe('A => B')
  })

  it('replaces \\neg with ¬', () => {
    expect(replaceShortcutsRealtime('¬P \\neg Q')).toBe('¬P ¬ Q')
  })
  it('replaces \\not with ¬', () => {
    expect(replaceShortcutsRealtime('A \\not B')).toBe('A ¬ B')
  })
  it('replaces \\! with ¬', () => {
    expect(replaceShortcutsRealtime('A \\! B')).toBe('A ¬ B')
  })

  it('replaces \\vdash with ⊢', () => {
    expect(replaceShortcutsRealtime('A \\vdash B')).toBe('A ⊢ B')
  })

  it('replaces \\forall with ∀', () => {
    expect(replaceShortcutsRealtime('\\forallx')).toBe('∀x')
  })
  it('replaces \\exists with ∃', () => {
    expect(replaceShortcutsRealtime('\\existsx')).toBe('∃x')
  })

  it('no replaces', () => {
    expect(replaceShortcutsRealtime('P Q R')).toBe('P Q R')
  })

  it('multiple shortcuts', () => {
    expect(replaceShortcutsRealtime('(\\forallx) (\\existsy) ((P(x) \\implies \\negQ(x)) \\vdash R(y))')).toBe('(∀x) (∃y) ((P(x) => ¬Q(x)) ⊢ R(y))')
  })
})
