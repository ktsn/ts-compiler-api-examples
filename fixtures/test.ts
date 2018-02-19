export function greet(person: string): string {
  return 'Hello, ' + toUpper(person)
}

function toUpper(str: string): string {
  return str.toUpperCase()
}