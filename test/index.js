import assert from 'node:assert/strict'
import test from 'node:test'
import katex from 'katex'
import {micromark} from 'micromark'
import {math, mathHtml} from 'micromark-extension-math'

const renderToString = katex.renderToString

test('math', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('micromark-extension-math')).sort(),
      ['math', 'mathHtml']
    )
  })

  await t.test(
    'should skip `mathFlow` and `mathText` construct if `disable.null` includes `mathFlow` and `mathText`',
    async function () {
      assert.equal(
        micromark('$a$, $$b$$\n\n$$\nc\n$$', {
          extensions: [math(), {disable: {null: ['mathFlow', 'mathText']}}],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$a$, $$b$$</p>\n<p>$$\nc\n$$</p>'
      )
    }
  )

  await t.test(
    'should support one, two, or more dollars by default',
    async function () {
      assert.equal(
        micromark('$a$, $$b$$, $$$c$$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p><span class="math math-inline">' +
          renderToString('a') +
          '</span>, <span class="math math-inline">' +
          renderToString('b') +
          '</span>, <span class="math math-inline">' +
          renderToString('c') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support two or more dollars w/ `singleDollarTextMath: false`, but not one',
    async function () {
      assert.equal(
        micromark('$a$, $$b$$, $$$c$$$', {
          extensions: [math({singleDollarTextMath: false})],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$a$, <span class="math math-inline">' +
          renderToString('b') +
          '</span>, <span class="math math-inline">' +
          renderToString('c') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support an escaped dollar sign which would otherwise open math',
    async function () {
      assert.equal(
        micromark('a \\$b$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $b$</p>'
      )
    }
  )

  await t.test(
    'should not support escaped dollar signs in math (text)',
    async function () {
      assert.throws(function () {
        micromark('a $b\\$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        })
      }, /KaTeX parse error: Unexpected character: '\\' at position 2/)
    }
  )

  await t.test(
    'should support math (text) right after an escaped dollar sign',
    async function () {
      assert.equal(
        micromark('a \\$$b$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a $<span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support a single dollar in math (text) w/ padding and two dollar signs',
    async function () {
      assert.throws(function () {
        micromark('a $$ $ $$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        })
      }, /KaTeX parse error: Can't use function '\$' in math mode at position 1/)
    }
  )

  await t.test(
    'should support nested math by using more dollars outside of math (text)',
    async function () {
      assert.equal(
        micromark('a $$\\raisebox{0.25em}{$\\frac a b$}$$ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('\\raisebox{0.25em}{$\\frac a b$}') +
          '</span> b</p>'
      )
    }
  )

  await t.test(
    'should support an “escaped” dollar right on the KaTeX level, not on the Markdown level',
    async function () {
      assert.equal(
        micromark('a $$ \\$ $$ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('\\$') +
          '</span> b</p>'
      )
    }
  )

  await t.test(
    'should support padding with a line ending in math (text)',
    async function () {
      assert.equal(
        micromark('a $$\na\\$ $$ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('a\\$') +
          '</span> b</p>'
      )
    }
  )

  await t.test(
    'should support math (text) w/ one dollar sign',
    async function () {
      assert.equal(
        micromark('a $b$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support math (text) w/ two dollar signs',
    async function () {
      assert.equal(
        micromark('a $$b$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support math (text) w/ three dollar signs',
    async function () {
      assert.equal(
        micromark('a $$$b$$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b') +
          '</span></p>'
      )
    }
  )

  await t.test('should support EOLs in math', async function () {
    assert.equal(
      micromark('a $b\nc\rd\r\ne$ f', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a <span class="math math-inline">' +
        renderToString('b\nc\rd\r\ne') +
        '</span> f</p>'
    )
  })

  await t.test(
    'should not support math (flow) w/ one dollar sign',
    async function () {
      assert.equal(
        micromark('$\na\n$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p><span class="math math-inline">' +
          renderToString('a') +
          '</span></p>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/ two dollar sign',
    async function () {
      assert.equal(
        micromark('$$\na\n$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/ three dollar sign',
    async function () {
      assert.equal(
        micromark('$$$\na\n$$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test('should support math (flow) w/o content', async function () {
    assert.equal(
      micromark('$$\n$$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>'
    )
  })

  await t.test(
    'should support math (flow) w/o closing fence',
    async function () {
      assert.equal(
        micromark('$$\na', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/o closing fence ending at an EOL',
    async function () {
      assert.equal(
        micromark('$$\na\n', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (flow) w/ a meta string',
    async function () {
      assert.equal(
        micromark('$$asd &amp; \\& asd\na\n$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should not support math (flow) w/ a dollar sign in the meta string',
    async function () {
      assert.equal(
        micromark('$$asd$asd\na\n$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>$$asd$asd\na</p>\n<div class="math math-display">' +
          renderToString('', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should not support math (flow) w/ content on the closing fence',
    async function () {
      assert.throws(function () {
        micromark('$$\na\n$$ b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        })
      }, /KaTeX parse error: Can't use function '\$' in math mode at position 3/)
    }
  )

  await t.test(
    'should support whitespace on the closing fence',
    async function () {
      assert.equal(
        micromark('$$\na\n$$  ', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should strip the prefix of the opening fence from content lines',
    async function () {
      assert.equal(
        micromark('  $$\n\ta\n  b\n c\nd\n$$', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('  a\nb\nc\nd', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should strip arbitrary length prefix from closing fence line (codeIndented disabled)',
    async function () {
      assert.equal(
        micromark('      $$\n      a\n          $$', {
          extensions: [math(), {disable: {null: ['codeIndented']}}],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support math (flow) in a block quote',
    async function () {
      assert.equal(
        micromark('> $$\n> a\n> $$\n> b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<blockquote>\n' +
          '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>\n' +
          '<p>b</p>\n' +
          '</blockquote>'
      )
    }
  )

  await t.test(
    'should support math (flow) in a list (item)',
    async function () {
      assert.equal(
        micromark('* $$\n  a\n  $$\n  b', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<ul>\n' +
          '<li>\n' +
          '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>\n' +
          'b' +
          '</li>\n' +
          '</ul>'
      )
    }
  )

  await t.test('should support `<`', async function () {
    assert.equal(
      micromark('a $\\sum_{\\substack{0<i<m\\\\0<j<n}}$ b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a <span class="math math-inline">' +
        renderToString('\\sum_{\\substack{0<i<m\\\\0<j<n}}') +
        '</span> b</p>'
    )
  })

  await t.test('should support `"`', async function () {
    assert.equal(
      micromark('a $\\text{a \\"{a} c}$ b', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a <span class="math math-inline">' +
        renderToString('\\text{a \\"{a} c}') +
        '</span> b</p>'
    )
  })

  await t.test('should support options', async function () {
    assert.equal(
      micromark('a $$ $ $$', {
        extensions: [math()],
        htmlExtensions: [mathHtml({throwOnError: false})]
      }),
      '<p>a <span class="math math-inline"><span class="katex-error" title="ParseError: KaTeX parse error: Can&#x27;t use function &#x27;$&#x27; in math mode at position 1: $̲" style="color:#cc0000">$</span></span></p>'
    )
  })

  await t.test('should not support laziness (1)', async function () {
    assert.equal(
      micromark('> $$\na\n$$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<blockquote>\n<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>\n</blockquote>\n<p>a</p>\n<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>'
    )
  })

  await t.test('should not support laziness (2)', async function () {
    assert.equal(
      micromark('> $$\n> a\n$$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<blockquote>\n<div class="math math-display">' +
        renderToString('a', {displayMode: true}) +
        '</div>\n</blockquote>\n<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>'
    )
  })

  await t.test('should not support laziness (3)', async function () {
    assert.equal(
      micromark('a\n> $$', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<p>a</p>\n<blockquote>\n<div class="math math-display">' +
        renderToString('', {displayMode: true}) +
        '</div>\n</blockquote>'
    )
  })

  await t.test(
    'should support inline math with LaTeX-style delimiters \\( \\)',
    async function () {
      assert.equal(
        micromark('a \\(b\\) c', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-inline">' +
          renderToString('b') +
          '</span> c</p>'
      )
    }
  )

  await t.test(
    'should support display math with LaTeX-style delimiters \\[ \\]',
    async function () {
      assert.equal(
        micromark('\\[\na\n\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support LaTeX-style inline math with complex expressions',
    async function () {
      assert.equal(
        micromark('The formula \\(E = mc^2\\) is famous', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>The formula <span class="math math-inline">' +
          renderToString('E = mc^2') +
          '</span> is famous</p>'
      )
    }
  )

  await t.test(
    'should support LaTeX-style display math with multiple lines',
    async function () {
      assert.equal(
        micromark('\\[\n\\frac{1}{2}\n\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('\\frac{1}{2}', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support an escaped backslash before inline math (text) delimiter',
    async function () {
      assert.equal(
        micromark('a \\\\(b\\) c', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a \\(b) c</p>'
      )
    }
  )

  await t.test(
    'should support an escaped backslash before display math delimiter',
    async function () {
      assert.equal(
        micromark('\\\\[\na\n\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>\\[\na\n]</p>'
      )
    }
  )

  await t.test(
    'should support math (text) with LaTeX delimiters right after an escaped backslash',
    async function () {
      assert.equal(
        micromark('a \\\\\\(b\\) c', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a \\<span class="math math-inline">' +
          renderToString('b') +
          '</span> c</p>'
      )
    }
  )

  await t.test(
    'should not support LaTeX-style inline math with only opening delimiter',
    async function () {
      assert.equal(
        micromark('a \\(b c', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a (b c</p>'
      )
    }
  )

  await t.test(
    'should support LaTeX-style display math w/o closing fence',
    async function () {
      assert.equal(
        micromark('\\[\na', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support LaTeX-style display math w/o closing fence ending at an EOL',
    async function () {
      assert.equal(
        micromark('\\[\na\n', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support whitespace on the LaTeX-style closing fence',
    async function () {
      assert.equal(
        micromark('\\[\na\n\\]  ', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should support whitespace and newline after LaTeX-style closing fence',
    async function () {
      assert.equal(
        micromark('\\[\na\n\\]    \n', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>\n'
      )
    }
  )

  await t.test(
    'should support whitespace and newline after LaTeX-style closing fence',
    async function () {
      assert.equal(
        micromark('\\[\na\n\\]    \ntest', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('a', {displayMode: true}) +
          '</div>\n<p>test</p>'
      )
    }
  )

  await t.test(
    'should support inline display math with LaTeX-style delimiters \\[ \\]',
    async function () {
      assert.equal(
        micromark('a \\[b\\] c', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>a <span class="math math-display">' +
          renderToString('b', {displayMode: true}) +
          '</span> c</p>'
      )
    }
  )

  await t.test(
    'should support inline display math in table cells',
    async function () {
      assert.equal(
        micromark('| Column | Formula \\[x^2\\] here |', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>| Column | Formula <span class="math math-display">' +
          renderToString('x^2', {displayMode: true}) +
          '</span> here |</p>'
      )
    }
  )

  await t.test(
    'should support inline display math with complex expressions',
    async function () {
      assert.equal(
        micromark('The formula \\[\\frac{a}{b}\\] is important.', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<p>The formula <span class="math math-display">' +
          renderToString('\\frac{a}{b}', {displayMode: true}) +
          '</span> is important.</p>'
      )
    }
  )

  await t.test(
    'should handle block display math with trailing content from LLM output',
    async function () {
      assert.equal(
        micromark('\\[\n\\$1,000,000\n\\]                             |', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('\\$1,000,000', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should handle block display math with trailing whitespace after closing fence',
    async function () {
      assert.equal(
        micromark('\\[\n\\big| |x| - |y| \\big| \\leq |x - y|\n\\]     ', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('\\big| |x| - |y| \\big| \\leq |x - y|', {
            displayMode: true
          }) +
          '</div>'
      )
    }
  )

  await t.test(
    'should handle backslashes in math content that are not closing fences',
    async function () {
      assert.equal(
        micromark('\\[\n\\text{hello} \\alpha \\beta\n\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('\\text{hello} \\alpha \\beta', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test(
    'should handle closing fence inline with content',
    async function () {
      assert.equal(
        micromark('\\[\nx = 1\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('x = 1', {displayMode: true}) +
          '</div>'
      )
    }
  )

  await t.test('should handle math with empty lines', async function () {
    assert.equal(
      micromark('\\[\nx = 1\n\ny = 2\n\\]', {
        extensions: [math()],
        htmlExtensions: [mathHtml()]
      }),
      '<div class="math math-display">' +
        renderToString('x = 1\n\ny = 2', {displayMode: true}) +
        '</div>'
    )
  })

  await t.test(
    'should handle math starting with empty line',
    async function () {
      assert.equal(
        micromark('\\[\n\nx = 1\n\\]', {
          extensions: [math()],
          htmlExtensions: [mathHtml()]
        }),
        '<div class="math math-display">' +
          renderToString('\nx = 1', {displayMode: true}) +
          '</div>'
      )
    }
  )
})
