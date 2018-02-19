import * as path from 'path'
import * as ts from 'typescript'

const outputPath = path.resolve(__dirname, 'output/2-print-code.ts')

// Create a source file
const source = ts.createSourceFile(outputPath, '', ts.ScriptTarget.Latest)

// Generate AST of TypeScript code
// const test: string = 'Hello!';
const ast = ts.createVariableDeclarationList([
  ts.createVariableDeclaration(
    ts.createIdentifier('test'),
    ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    ts.createLiteral('Hello!')
  )
], ts.NodeFlags.Const)

// Convert AST to string by using printer
const printer = ts.createPrinter()
const code = printer.printNode(ts.EmitHint.Unspecified, ast, source)
console.log(code)