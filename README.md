![Build](https://github.com/letsflow/jmespath/actions/workflows/nodejs.yml/badge.svg?branch=main)

# @letsflow/jmespath

@letsflow/jmespath is a **TypeScript** implementation of the [JMESPath](https://jmespath.org/) spec.

JMESPath is a query language for JSON. It will take a JSON document
as input and transform it into another JSON document
given a JMESPath expression.

This fork extends the original specs, adding the following functionality;

* [Custom functions](#custom-functions)
* [Root value access](#root-value-access)
* [Number literals](#number-literals)

## INSTALLATION

```
npm install @letsflow/jmespath
```

## USAGE

### `search(data: JSONValue, expression: string): JSONValue`

```javascript
import { search } from '@letsflow/jmespath';

search(
  { foo: { bar: { baz: [0, 1, 2, 3, 4] } } },
  "foo.bar.baz[2]"
);

// OUTPUTS: 2
```

In the example we gave the `search` function input data of
`{foo: {bar: {baz: [0, 1, 2, 3, 4]}}}` as well as the JMESPath
expression `foo.bar.baz[2]`, and the `search` function evaluated
the expression against the input data to produce the result `2`.

The JMESPath language can do *a lot* more than select an element
from a list.  Here are a few more examples:

```javascript
import { search } from '@letsflow/jmespath';

const document = {
  foo: {
    bar: {
      baz: [0, 1, 2, 3, 4]
    }
  }
};

search(document, "foo.bar");
// OUTPUTS: { baz: [ 0, 1, 2, 3, 4 ] }
```

```javascript
import { search } from '@letsflow/jmespath';

const document = {
  "foo": [
    { "first": "a", "last": "b" },
    { "first": "c", "last": "d" }
  ]
};

search(document, "foo[*].first")
// OUTPUTS: [ 'a', 'c' ]
```

```javascript
import { search } from '@letsflow/jmespath';

const document = {
  "foo": [
    { "age": 20 },
    { "age": 25 },
    { "age": 30 },
    { "age": 35 },
    { "age": 40 }
  ]
}

search(document, "foo[?age > `30`]");
// OUTPUTS: [ { age: 35 }, { age: 40 } ]
```

### `compile(expression: string): ExpressionNodeTree`

You can precompile all your expressions ready for use later on. the `compile`
function takes a JMESPath expression and returns an abstract syntax tree that
can be used by the TreeInterpreter function

```javascript
import { compile, TreeInterpreter } from '@jmespath-community/jmespath';

const ast = compile('foo.bar');

TreeInterpreter.search(ast, { foo: { bar: 'BAZ' } })
// RETURNS: "BAZ"
```

## EXTENSIONS TO ORIGINAL SPEC

### Custom functions

#### `registerFunction(functionName: string, customFunction: RuntimeFunction, signature: InputSignature[]): void`

Extend the list of built-in JMESpath expressions with your own functions.

```javascript
  import {search, registerFunction, TYPE_NUMBER} from '@letsflow/jmespath'

  search({ foo: 60, bar: 10 }, 'divide(foo, bar)')
  // THROWS ERROR: Error: Unknown function: divide()

  registerFunction(
    'divide', // FUNCTION NAME
    (resolvedArgs) => {   // CUSTOM FUNCTION
      const [dividend, divisor] = resolvedArgs;
      return dividend / divisor;
    },
    [{ types: [TYPE_NUMBER] }, { types: [TYPE_NUMBER] }] //SIGNATURE
  );

  search({ foo: 60, bar: 10 }, 'divide(foo, bar)');
  // OUTPUTS: 6
```

Optional arguments are supported by setting `{..., optional: true}` in argument signatures

```javascript
  registerFunction(
    'divide',
    (resolvedArgs) => {
      const [dividend, divisor] = resolvedArgs;
      return dividend / divisor ?? 1; //OPTIONAL DIVISOR THAT DEFAULTS TO 1
    },
    [{ types: [TYPE_NUMBER] }, { types: [TYPE_NUMBER], optional: true }] //SIGNATURE
  );

  search({ foo: 60, bar: 10 }, 'divide(foo)');
  // OUTPUTS: 60
```

### Root value access

Use `$` to access the document root.

```javascript
search({foo: { bar: 999 }, baz: [1, 2, 3]}, '$.baz[*].[@, $.foo.bar]')

// OUTPUTS:
// [ [ 1, 999 ], [ 2, 999 ], [ 3, 999 ] ]
```

### Number literals

Numbers in the root scope are treated as number literals. This means that you don't
need to quote numbers with backticks.

```javascript
search([{"bar": 1}, {"bar": 10}]}, '[?bar==10]')

// OUTPUTS;
// [{"bar": 10}]
```

You can also use numbers in arithmetic operations

```
search({}, '16 + 26'); // 42

// With the original specs we'd need to do
search({}, '`16` + `26`');
```

## More Resources

The example above only shows a small amount of what
a JMESPath expression can do. If you want to take a
tour of the language, the *best* place to go is the
[JMESPath Tutorial](https://jmespath.org/tutorial.html).

The full JMESPath specification can be found
on the [JMESPath site](https://jmespath.org/specification.html).
