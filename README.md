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

Additionally, it adds the following functions:

* [if](#if) - Conditional expression
* [range](#range) - Generate a range of numbers or prefixed strings
* [to_object](#to_object) - Convert an array of key-value pairs into an object
* [json_serialize](#json_serialize) - Serialize a JSON value to a string
* [json_parse](#json_parse) - Parse a JSON string into a JSON object
* [sha256](#sha256) - Calculate the SHA-256 hash of a string
* [sha512](#sha512) - Calculate the SHA-512 hash of a string
* [uuid](#uuid) - Generate a UUID
* [regex_test](#regex_test) - Test if a string matches a regular expression
* [regex_match](#regex_match) - Return the first match of a regular expression in a string
* [regex_match_all](#regex_match_all) - Return all matches of a regular expression in a string
* [regex_replace](#regex_replace) - Replace parts of a string matching a regular expression with a replacement string

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
search([{"bar": 1}, {"bar": 10}], '[?bar==10]')

// OUTPUTS;
// [{"bar": 10}]
```

You can also use numbers in arithmetic operations

```
search({}, '16 + 26'); // 42
```

## Additional Functions

### `if`
**Syntax**:
```jmespath
if(condition, thenValue, elseValue?)
```

**Description**:  
Returns `thenValue` if `condition` is true, otherwise returns `elseValue`. If `elseValue` is not provided, it defaults to `null`.

**Example**:
```jmespath
if(@ > 10, "large", "small")
```

### `range`
**Syntax**:
```jmespath
range(start, end, prefix?)
```

**Description**:  
Generates an array of numbers or prefixed strings from `start` to `end - 1`. If `prefix` is provided, each number is prefixed.

**Example**:
```jmespath
range(5)                // [0, 1, 2, 3, 4]
range(1, 5)             // [1, 2, 3, 4]
range(1, 5, 'item_')    // ["item_1", "item_2", "item_3", "item_4"]
```

### `to_object`
**Syntax**:
```jmespath
to_object(entries)
```

**Description**:  
Converts an array of key-value pairs into an object.

**Example**:
```jmespath
to_object([['key1', 'value1'], ['key2', 'value2']])
// { "key1": "value1", "key2": "value2" }

[ 'value1', 'value2'] | to_object(zip(range(1, length(@) + 1, 'key'), @))
// { "key1": "value1", "key2": "value2" }
```

### `json_serialize`
**Syntax**:
```jmespath
json_serialize(value)
```

_Uses a deterministic version of JSON.stringify to serialize the value._

**Description**:  
Serializes a JSON value to a string.

**Example**:
```jmespath
json_serialize({ key: 'value' })
// "{\"key\":\"value\"}"
```

### `json_parse`
**Syntax**:
```jmespath
json_parse(string)
```

**Description**:  
Parses a JSON string into a JSON object.

**Example**:
```jmespath
json_parse("{\"key\":\"value\"}")
// { "key": "value" }
```

### `sha256`
**Syntax**:
```jmespath
sha256(string)
```

**Description**:  
Calculates the SHA-256 hash of a string and returns it as a hexadecimal string.

**Example**:
```jmespath
sha256('hello')
// "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
```

### `sha512`
**Syntax**:
```jmespath
sha512(string)
```

**Description**:  
Calculates the SHA-512 hash of a string and returns it as a hexadecimal string.

**Example**:
```jmespath
sha512('hello')
// "9b71d224bd62f3785d96d46ad3ea3d73319b0c44e59b202205c5d235a0a6caa5a3b36f8c0ab9d45df9215bf07d4d1552c0b1f8bd2671c8a7a3d126f457d79d72"
```

### `uuid`
**Syntax**:
```jmespath
uuid(name?, namespace?)
```

**Description**:  
Generates a UUID. If `name` and (optionally) `namespace` are provided, generates a version 5 UUID; otherwise, generates a version 4 UUID.

**Example**:
```jmespath
uuid() // Random v4 UUID
uuid('example') // v5 UUID
uuid('example', '6ba7b810-9dad-11d1-80b4-00c04fd430c8') // v5 UUID with namespace
```

`name` must be a string. Use `json_serialize()` to convert a JSON object to a string.

### `regex_test`
**Syntax**:
```jmespath
regex_test(regex, string)
```

**Description**:  
Tests if a string matches a given regular expression.

**Example**:
```jmespath
regex_test('/^hello/', 'hello world') // true

regex_test('/^hello/', 'HELLO world') // false
regex_test('/^hello/i', 'HELLO world') // true
```

### `regex_match`
**Syntax**:
```jmespath
regex_match(regex, string)
```

**Description**:  
Returns the first match of a regular expression in a string as an array.

**Example**:
```jmespath
regex_match('/hello (\\w+)/', 'hello world')
// ["hello world", "world"]

regex_match('/\\w+/g', 'hello world')
// ["hello", "world"]
```

### `regex_match_all`
**Syntax**:
```jmespath
regex_match_all(regex, string)
```

**Description**:  
Returns all matches of a regular expression in a string as an array of arrays.

**Example**:
```jmespath
regex_match_all('/(\\w+)=(\d+)/g', 'foo=24 bar=99')
// [["foo=24", "foo", "24"], ["bar=99", "bar", "99"]]
```

### `regex_replace`
**Syntax**:
```jmespath
regex_replace(regex, replacement, string)
```

**Description**:  
Replaces parts of a string matching a regular expression with a replacement string.

**Example**:
```jmespath
regex_replace('/world/', 'universe', 'hello world')
// "hello universe"
```

## More Resources

The example above only shows a small amount of what
a JMESPath expression can do. If you want to take a
tour of the language, the *best* place to go is the
[JMESPath Tutorial](https://jmespath.org/tutorial.html).

The full JMESPath specification can be found
on the [JMESPath site](https://jmespath.org/specification.html).
