/**
 * @import {Construct, State, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

import {ok as assert} from 'devlop'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding} from 'micromark-util-character'
import {codes, types} from 'micromark-util-symbol'

/** @type {Construct} */
export const mathFlowLatex = {
  tokenize: tokenizeMathFlowLatex,
  concrete: true,
  name: 'mathFlowLatex'
}

/** @type {Construct} */
const nonLazyContinuation = {
  tokenize: tokenizeNonLazyContinuation,
  partial: true
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeMathFlowLatex(effects, ok, nok) {
  const self = this
  const tail = self.events[self.events.length - 1]
  const initialSize =
    tail && tail[1].type === types.linePrefix
      ? tail[2].sliceSerialize(tail[1], true).length
      : 0
  let contentStarted = false
  let insideMathFlowValue = false

  return start

  /**
   * Start of math with LaTeX delimiters.
   *
   * ```markdown
   * > | \[
   *     ^
   *   | \frac{1}{2}
   *   | \]
   * ```
   *
   * @type {State}
   */
  function start(code) {
    assert(code === codes.backslash, 'expected `\\`')
    effects.enter('mathFlow')
    effects.enter('mathFlowFence')
    effects.enter('mathFlowFenceSequence')
    effects.consume(code)
    return openBracket
  }

  /**
   * After backslash, expecting open bracket.
   *
   * ```markdown
   * > | \[
   *      ^
   *   | \frac{1}{2}
   *   | \]
   * ```
   *
   * @type {State}
   */
  function openBracket(code) {
    if (code === codes.leftSquareBracket) {
      effects.consume(code)
      effects.exit('mathFlowFenceSequence')
      return afterOpeningFence
    }

    return nok(code)
  }

  /**
   * After opening fence.
   *
   * ```markdown
   * > | \[
   *       ^
   *   | \frac{1}{2}
   *   | \]
   * ```
   *
   * @type {State}
   */
  function afterOpeningFence(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit('mathFlowFence')

      if (self.interrupt) {
        return ok(code)
      }

      return effects.attempt(
        nonLazyContinuation,
        beforeNonLazyContinuation,
        after
      )(code)
    }

    return nok(code)
  }

  /**
   * After eol/eof in math, at a non-lazy closing fence or content.
   *
   * ```markdown
   *   | \[
   * > | \frac{1}{2}
   *     ^
   * > | \]
   *     ^
   * ```
   *
   * @type {State}
   */
  function beforeNonLazyContinuation(code) {
    return effects.attempt(
      {tokenize: tokenizeClosingFence, partial: true},
      after,
      contentStart
    )(code)
  }

  /**
   * Before math content, definitely not before a closing fence.
   *
   * ```markdown
   *   | \[
   * > | \frac{1}{2}
   *     ^
   *   | \]
   * ```
   *
   * @type {State}
   */
  function contentStart(code) {
    return (
      initialSize
        ? factorySpace(
            effects,
            beforeContentChunk,
            types.linePrefix,
            initialSize + 1
          )
        : beforeContentChunk
    )(code)
  }

  /**
   * Before math content, after optional prefix.
   *
   * ```markdown
   *   | \[
   * > | \frac{1}{2}
   *     ^
   *   | \]
   * ```
   *
   * @type {State}
   */
  function beforeContentChunk(code) {
    if (code === codes.eof) {
      return after(code)
    }

    if (markdownLineEnding(code)) {
      return effects.attempt(
        nonLazyContinuation,
        beforeNonLazyContinuation,
        after
      )(code)
    }

    if (!insideMathFlowValue) {
      effects.enter('mathFlowValue')
      contentStarted = false
      insideMathFlowValue = true
    }

    return contentChunk(code)
  }

  /**
   * In math content.
   *
   * ```markdown
   *   | \[
   * > | \frac{1}{2}
   *      ^
   *   | \]
   * ```
   *
   * @type {State}
   */
  function contentChunk(code) {
    if (code === codes.eof || markdownLineEnding(code)) {
      // We should always have content here because beforeContentChunk checks
      // for EOF/EOL before entering mathFlowValue
      if (contentStarted) {
        effects.exit('mathFlowValue')
        insideMathFlowValue = false
        contentStarted = false
      }

      return beforeContentChunk(code)
    }

    // Check for inline closing fence after we've consumed at least one character
    if (code === codes.backslash && contentStarted) {
      effects.exit('mathFlowValue')
      insideMathFlowValue = false
      return effects.attempt(
        {tokenize: tokenizeClosingFence, partial: true},
        after,
        contentAfterFailedClose
      )(code)
    }

    effects.consume(code)
    contentStarted = true
    return contentChunk
  }

  /**
   * After failed attempt to parse closing fence inline.
   * The backslash was just content.
   *
   * ```markdown
   *   | \[
   * > | \frac{1}{2} \text{not closing}
   *                 ^
   *   | \]
   * ```
   *
   * @type {State}
   */
  function contentAfterFailedClose(code) {
    assert(code === codes.backslash, 'expected `\\`')
    effects.enter('mathFlowValue')
    insideMathFlowValue = true
    effects.consume(code)
    contentStarted = true
    return contentChunk
  }

  /**
   * After math.
   *
   * ```markdown
   *   | \[
   *   | \frac{1}{2}
   * > | \]
   *       ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    effects.exit('mathFlow')
    return ok(code)
  }

  /** @type {Tokenizer} */
  function tokenizeClosingFence(effects, ok, nok) {
    /**
     * Before closing fence, at optional whitespace.
     *
     * ```markdown
     *   | \[
     *   | \frac{1}{2}
     * > | \]
     *     ^
     * ```
     */
    return factorySpace(
      effects,
      beforeClosingSequence,
      types.linePrefix,
      self.parser.constructs.disable.null &&
        self.parser.constructs.disable.null.includes('codeIndented')
        ? undefined
        : 4
    )

    /**
     * Before closing sequence, after optional whitespace.
     *
     * ```markdown
     *   | \[
     *   | \frac{1}{2}
     * > | \]
     *     ^
     * ```
     *
     * @type {State}
     */
    function beforeClosingSequence(code) {
      if (code === codes.backslash) {
        effects.enter('mathFlowFence')
        effects.enter('mathFlowFenceSequence')
        effects.consume(code)
        return closeBracket
      }

      return nok(code)
    }

    /**
     * After backslash, expecting close bracket.
     *
     * ```markdown
     *   | \[
     *   | \frac{1}{2}
     * > | \]
     *      ^
     * ```
     *
     * @type {State}
     */
    function closeBracket(code) {
      if (code === codes.rightSquareBracket) {
        effects.consume(code)
        effects.exit('mathFlowFenceSequence')
        return factorySpace(effects, afterClosingSequence, types.whitespace)
      }

      return nok(code)
    }

    /**
     * After closing fence sequence, after optional whitespace.
     *
     * ```markdown
     *   | \[
     *   | \frac{1}{2}
     * > | \] trailing
     *       ^
     * ```
     *
     * @type {State}
     */
    function afterClosingSequence(code) {
      effects.exit('mathFlowFence')

      if (code === codes.eof || markdownLineEnding(code)) {
        return ok(code)
      }

      // Consume trailing content on the line
      effects.enter('mathFlowTrailing')
      return consumeTrailing(code)
    }

    /**
     * Consume trailing content until EOL/EOF.
     *
     * @type {State}
     */
    function consumeTrailing(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit('mathFlowTrailing')
        return ok(code)
      }

      effects.consume(code)
      return consumeTrailing
    }
  }
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeNonLazyContinuation(effects, ok, nok) {
  const self = this

  return start

  /** @type {State} */
  function start(code) {
    if (code === codes.eof) {
      return ok(code)
    }

    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return lineStart
  }

  /** @type {State} */
  function lineStart(code) {
    return self.parser.lazy[self.now().line] ? nok(code) : ok(code)
  }
}
