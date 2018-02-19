import * as path from 'path'
import * as fs from 'fs'
import * as ts from 'typescript'

const templatePath = path.resolve(__dirname, '../fixtures/template.html')
const dataPath = path.resolve(__dirname, '../fixtures/data.ts')

// Create language service
const host: ts.LanguageServiceHost = {
  getCompilationSettings: () => ({
    allowNonTsExtensions: true
  }),
  getScriptFileNames: () => [templatePath, dataPath],
  getScriptVersion: fileName => '1',
  getScriptSnapshot: fileName => {
    if (!fs.existsSync(fileName)) {
      return undefined;
    }

    return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
  },
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getDefaultLibFileName: ts.getDefaultLibFileName
}
const service = ts.createLanguageService(host)

// Rewrite source file generator function to handle html
const clssf = ts.createLanguageServiceSourceFile
const ulssf = ts.updateLanguageServiceSourceFile
;(ts as any).createLanguageServiceSourceFile = function createLanguageServiceSourceFile(
  fileName: string,
  scriptSnapshot: ts.IScriptSnapshot,
  scriptTarget: ts.ScriptTarget,
  version: string,
  setNodeParents: boolean,
  scriptKind?: ts.ScriptKind
): ts.SourceFile {
  const source = clssf(fileName, scriptSnapshot, scriptTarget, version, setNodeParents, scriptKind)
  if (fileName === templatePath) {
    transformTemlate(
      source,
      scriptSnapshot.getText(0, scriptSnapshot.getLength()),
      dataPath
    )
  }
  return source
}
;(ts as any).updateLanguageServiceSourceFile = function updateLanguageServiceSourceFile(
  sourceFile: ts.SourceFile,
  scriptSnapshot: ts.IScriptSnapshot,
  version: string,
  textChangeRange: ts.TextChangeRange,
  aggressiveChecks?: boolean
): ts.SourceFile {
  const source = ulssf(sourceFile, scriptSnapshot, version, textChangeRange, aggressiveChecks)
  if (source.fileName === templatePath) {
    transformTemlate(
      source,
      scriptSnapshot.getText(0, scriptSnapshot.getLength()),
      dataPath
    )
  }
  return source
}

// Parse expressions in template html
function transformTemlate(source: ts.SourceFile, html: string, dataPath: string): void {
  const regexp = /\{\{(.+)\}\}/g

  // We need explicitly set text range for AST to avoid internal assertion error
  const setZeroPos = <T extends ts.Node>(node: T): T => {
    return ts.setTextRange(node, { pos: 0, end: 0 })
  }

  // Add import declaration for data
  const importNode = setZeroPos(ts.createImportDeclaration(
    undefined,
    undefined,
    setZeroPos(ts.createImportClause(
      setZeroPos(ts.createIdentifier('data')),
      undefined
    )),
    setZeroPos(ts.createLiteral(dataPath.slice(0, -3)))
  ))

  let match
  const expressions: ts.Statement[] = []
  while (match = regexp.exec(html)) {
    // Get expression position to refer later
    const offset = match.index + 2

    // Parse expression and generate TS AST
    const source = ts.createSourceFile('/tmp/test.ts', match[1], ts.ScriptTarget.Latest)
    expressions.push(...source.statements)

    // Walk nodes and modify the offset
    ts.forEachChild(source, function next(node) {
      ts.setTextRange(node, {
        pos: offset + node.pos,
        end: offset + node.end
      })
      ts.forEachChild(node, next)
    })
  }

  source.statements = ts.createNodeArray([
    importNode,
    ...expressions
  ])
}

// Get diagnostic of html template
service.getSemanticDiagnostics(templatePath)
  .forEach(diag => {
    const pos = diag.start != null && diag.length != null
      ? `[${diag.start}-${diag.start + diag.length}] `
      : ''

    console.log(pos + diag.messageText)
  })
