/**
 * @import {Options} from 'micromark-extension-math'
 * @import {Extension} from 'micromark-util-types'
 */

import {codes} from 'micromark-util-symbol'
import {mathFlow} from './math-flow.js'
import {mathFlowLatex} from './math-flow-latex.js'
import {mathText} from './math-text.js'
import {mathTextLatex} from './math-text-latex.js'

/**
 * Create an extension for `micromark` to enable math syntax.
 *
 * @param {Options | null | undefined} [options={}]
 *   Configuration (default: `{}`).
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable math syntax.
 */
export function math(options) {
  return {
    flow: {[codes.dollarSign]: mathFlow, [codes.backslash]: mathFlowLatex},
    text: {
      [codes.dollarSign]: mathText(options),
      [codes.backslash]: mathTextLatex
    }
  }
}
