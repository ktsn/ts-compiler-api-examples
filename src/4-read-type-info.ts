import * as ts from 'typescript'

// Create a program
const program = ts.createProgram(['fixtures/class.ts'], {})

// Get type checker to obtain type info
const checker = program.getTypeChecker()

// Get source file and traverse its AST
const source = program.getSourceFile('fixtures/class.ts')
if (source) {
  console.log('# Exported Class List\n')
  ts.forEachChild(source, function next(node) {
    // Document exported classes
    if (
      isExported(node) &&
      ts.isClassDeclaration(node) &&
      node.name
    ) {
      // Get the type of class instance
      const type = checker.getTypeAtLocation(node)

      // Get the symbol of class constructor
      const ctorSymbol = checker.getSymbolAtLocation(node.name)
      if (!ctorSymbol) return

      console.log(printClassDoc(type, ctorSymbol))
    }
  })
}

function printClassDoc(type: ts.Type, ctorSymbol: ts.Symbol): string {
  // Print class name
  let buf = '## ' + ctorSymbol.name + '\n'

  // Print constructor type
  const ctorType = checker.getTypeOfSymbolAtLocation(ctorSymbol, ctorSymbol.valueDeclaration!)
  ctorType.getConstructSignatures().forEach(sig => {
    // parameter types
    const params = sig.parameters.map(serializeSymbol)

    // return type
    const ret = checker.typeToString(sig.getReturnType())

    buf += '\nnew (' + params.join(', ') + ') => ' + ret + '\n'
  })

  buf += '\n### Properties\n'

  // Print properties
  type.getProperties().forEach(p => {
    buf += '\n- ' + serializeSymbol(p)
  })

  return buf + '\n'
}

function serializeSymbol(symbol: ts.Symbol): string {
  const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
  return symbol.name + ': ' + checker.typeToString(type)
}

function isExported(node: ts.Node): boolean {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0
}