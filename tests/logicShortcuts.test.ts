import { describe, it, expect } from 'vitest'
import { replaceShortcutsRealtime } from '../src/utils/logicInputShortcuts'

describe('replaceShortcutsRealtime', () => {
  it('nahradí \\rightarrow na =>', () => {
    expect(replaceShortcutsRealtime('A \\rightarrow B')).toBe('A => B')
  })
  it('nahradí \\implies na =>', () => {
    expect(replaceShortcutsRealtime('P \\implies Q')).toBe('P => Q')
  })
  it('nahradí viac shortcutov naraz', () => {
    expect(replaceShortcutsRealtime('P \\and Q \\or R')).toBe('P && Q || R')
  })
  it('robí viacero náhrad v jednom vstupe', () => {
    expect(replaceShortcutsRealtime('F \\implies G \\rightarrow H \\and I')).toBe('F => G => H && I')
  })
  it('zachová input bez shortcutov', () => {
    expect(replaceShortcutsRealtime('X => Y')).toBe('X => Y')
  })
  it('nahradí negáciu', () => {
    expect(replaceShortcutsRealtime('!X \\not Y ~Z')).toBe('!X ! Y !Z')
  })
})