// Generate our react-native icons from the fonticon stylesheet and images
import fs from 'fs'
import path from 'path'

const css = fs.readFileSync('../desktop/renderer/fonticon.css', {encoding: 'utf8'})
const stream = fs.createWriteStream('../shared/common-adapters/icon.paths.native.js')

stream.once('open', () => {
  stream.write('// @flow\n')
  stream.write('// This file is generated by update-font-icon.js, DO NOT HAND EDIT!\n')
  stream.write('\n')

  stream.write('export const fontIcons: {[key: string]: string} = {\n')

  const glyphs = []
  let glyph = null
  css.split('\n').forEach(line => {
    if (glyph) {
      const val = line.match(/content: "\\(.*)";/)[1]
      glyphs.push(`  '${glyph.slice('icon-kb-'.length)}': String.fromCharCode(0x${val})`)
      glyph = null
    } else {
      glyph = line.match(/^\.(.*):before/)
      if (glyph) {
        glyph = glyph[1]
      }
    }
  })

  stream.write(glyphs.join(',\n'))
  stream.write(',\n}\n\n')

  const images = fs.readdirSync('../shared/images/icons/').filter(i => i.endsWith('.png') && i.indexOf('@') === -1)

  stream.write('export const images: {[key: string]: string} = {\n')
  const requires = images.map(i => {
    return `// $FlowIssue\n  '${path.basename(i, path.extname(i))}': require('../images/icons/${i}')`
  })

  stream.write(requires.join(',\n'))
  stream.write(',\n}\n')

  stream.end()
})
