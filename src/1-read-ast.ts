import * as ts from 'typescript'

// Create program
const program = ts.createProgram(['fixtures/test.ts'], {})

// Get source of the specified file
const source = program.getSourceFile('fixtures/test.ts')

// Print AST
if (source) {
  console.log(source.statements)

  // Print all declared function names
  console.log('--- declared function names ---')
  ts.forEachChild(source, node => {
    if (ts.isFunctionDeclaration(node)) {
      console.log(node.name && node.name.text)
    }
  })
}