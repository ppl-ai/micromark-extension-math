/**
 * @import {Construct, Previous, Resolver, State, Token, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

import {ok as assert} from 'devlop'
import {markdownLineEnding} from 'micromark-util-character'
import {codes, types} from 'micromark-util-symbol'

/** @type {Construct} */
export const mathTextLatex = {
  tokenize: tokenizeMathTextLatex,
  resolve: resolveMathTextLatex,
  previous,
  name: 'mathTextLatex'
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeMathTextLatex(effects, ok, nok) {
  /** @type {Token} */
  let token

  return start

  /**
   * Start of math (text) with LaTeX delimiters.
   *
   * ```markdown
   * > | \(a\)
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    assert(code === codes.backslash, 'expected `\\`')
    effects.enter('mathText')
    effects.enter('mathTextSequence')
    effects.consume(code)
    return openParen
  }

  /**
   * After backslash, expecting open paren.
   *
   * ```markdown
   * > | \(a\)
   *      ^
   * ```
   *
   * @type {State}
   */
  function openParen(code) {
    if (code === codes.leftParenthesis) {
      effects.consume(code)
      effects.exit('mathTextSequence')
      return between
    }

    return nok(code)
  }

  /**
   * Between something and something else.
   *
   * ```markdown
   * > | \(a\)
   *       ^^
   * ```
   *
   * @type {State}
   */
  function between(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.backslash) {
      // Check if this is the closing sequence
      token = effects.enter('mathTextSequence')
      effects.consume(code)
      return closingBackslash
    }

    // Tabs don't work, and virtual spaces don't make sense.
    if (code === codes.space) {
      effects.enter('space')
      effects.consume(code)
      effects.exit('space')
      return between
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return between
    }

    // Data.
    effects.enter('mathTextData')
    return data(code)
  }

  /**
   * In data.
   *
   * ```markdown
   * > | \(a\)
   *       ^
   * ```
   *
   * @type {State}
   */
  function data(code) {
    if (
      code === codes.eof ||
      code === codes.space ||
      code === codes.backslash ||
      markdownLineEnding(code)
    ) {
      effects.exit('mathTextData')
      return between(code)
    }

    effects.consume(code)
    return data
  }

  /**
   * After backslash in potential closing sequence.
   *
   * ```markdown
   * > | \(a\)
   *         ^
   * ```
   *
   * @type {State}
   */
  function closingBackslash(code) {
    if (code === codes.rightParenthesis) {
      effects.consume(code)
      effects.exit('mathTextSequence')
      effects.exit('mathText')
      return ok
    }

    // It's not a closing sequence, treat the backslash as data
    token.type = 'mathTextData'
    return data(code)
  }
}

/** @type {Resolver} */
function resolveMathTextLatex(events) {
  let tailExitIndex = events.length - 4
  let headEnterIndex = 3
  /** @type {number} */
  let index
  /** @type {number | undefined} */
  let enter

  // If we start and end with an EOL or a space.
  if (
    (events[headEnterIndex][1].type === types.lineEnding ||
      events[headEnterIndex][1].type === 'space') &&
    (events[tailExitIndex][1].type === types.lineEnding ||
      events[tailExitIndex][1].type === 'space')
  ) {
    index = headEnterIndex

    // And we have data.
    while (++index < tailExitIndex) {
      if (events[index][1].type === 'mathTextData') {
        // Then we have padding.
        events[tailExitIndex][1].type = 'mathTextPadding'
        events[headEnterIndex][1].type = 'mathTextPadding'
        headEnterIndex += 2
        tailExitIndex -= 2
        break
      }
    }
  }

  // Merge adjacent spaces and data.
  index = headEnterIndex - 1
  tailExitIndex++

  while (++index <= tailExitIndex) {
    if (enter === undefined) {
      if (
        index !== tailExitIndex &&
        events[index][1].type !== types.lineEnding
      ) {
        enter = index
      }
    } else if (
      index === tailExitIndex ||
      events[index][1].type === types.lineEnding
    ) {
      events[enter][1].type = 'mathTextData'

      if (index !== enter + 2) {
        events[enter][1].end = events[index - 1][1].end
        events.splice(enter + 2, index - enter - 2)
        tailExitIndex -= index - enter - 2
        index = enter + 2
      }

      enter = undefined
    }
  }

  return events
}

/**
 * @this {TokenizeContext}
 * @type {Previous}
 */
function previous(code) {
  // Only allow if not preceded by a backslash (to allow escaping)
  return (
    code !== codes.backslash ||
    this.events[this.events.length - 1][1].type === types.characterEscape
  )
}
