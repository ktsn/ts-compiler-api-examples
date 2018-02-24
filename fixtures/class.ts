export class Foo {
  name = 'Foo'

  greet () {
    return 'Hi, I\'m ' + this.name
  }
}

export class Bar {
  name = 'Bar'

  constructor(
    public foo: Foo,
    public bar: Bar
  ) {}
}

// Private class so it's not documented
class Baz {
  name = 'Baz'
}