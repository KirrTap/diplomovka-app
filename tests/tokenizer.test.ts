import { describe, it, expect } from 'vitest'
import { logicTokenize } from '../src/utils/tokenizer'

describe('logicTokenize', () => {
    it('tokenizes simple formula', () => {
    expect(logicTokenize('A ∧ B')).toEqual([
        { type: 'identifier', value: 'A' },
        { type: 'and' },
        { type: 'identifier', value: 'B' },
        { type: 'eof' }
    ])
    })

    it('tokenizes formula with implications and quantifiers', () => {
        expect(logicTokenize('(∀x) (P(x) => (∃y) Q(y))')).toEqual([
            { type: 'lparen' },
            { type: 'forall' },
            { type: 'identifier', value: 'x' },
            { type: 'rparen' },
            { type: 'lparen' },
            { type: 'identifier', value: 'P' },
            { type: 'lparen' },
            { type: 'identifier', value: 'x' },
            { type: 'rparen' },
            { type: 'implies' },
            { type: 'lparen' },
            { type: 'exists' },
            { type: 'identifier', value: 'y' },
            { type: 'rparen' },
            { type: 'identifier', value: 'Q' },
            { type: 'lparen' },
            { type: 'identifier', value: 'y' },
            { type: 'rparen' },
            { type: 'rparen' },
            { type: 'eof' }
        ])
    })

    it('tokenizes formula with comma', () => {
    expect(logicTokenize('P(x,y)')).toEqual([
        { type: 'identifier', value: 'P' },
        { type: 'lparen' },
        { type: 'identifier', value: 'x' },
        { type: 'comma' },
        { type: 'identifier', value: 'y' },
        { type: 'rparen' },
        { type: 'eof' }
    ])
})
    it('tokenizes formula with unknown characters', () => {
        expect(logicTokenize('A $ B')).toEqual([
            { type: 'identifier', value: 'A' },
            { type: 'unknown', value: '$', position: 2 },
            { type: 'identifier', value: 'B' },
            { type: 'eof' }
        ])

        expect(logicTokenize('P(x) => (∃y)$Q(y)')).toEqual([
            { type: 'identifier', value: 'P' },
            { type: 'lparen' },
            { type: 'identifier', value: 'x' },
            { type: 'rparen' },
            { type: 'implies' },
            { type: 'lparen' },
            { type: 'exists' },
            { type: 'identifier', value: 'y' },
            { type: 'rparen' },
            { type: 'unknown', value: '$', position: 12 },
            { type: 'identifier', value: 'Q' },
            { type: 'lparen' },
            { type: 'identifier', value: 'y' },
            { type: 'rparen' },
            { type: 'eof' }
        ])
    })

    it(' input with only unknown characters', () => {
    expect(logicTokenize('#&@')).toEqual([
        { type: 'unknown', value: '#', position: 0 },
        { type: 'unknown', value: '&', position: 1 },
        { type: 'unknown', value: '@', position: 2 },
        { type: 'eof' }
    ])
})
    it('empty input', () => {
    expect(logicTokenize('  ')).toEqual([
        { type: 'eof' }
    ])
})
})