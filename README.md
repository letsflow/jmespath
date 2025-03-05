![Build](https://github.com/letsflow/jmespath/actions/workflows/nodejs.yml/badge.svg?branch=main)

# @letsflow/jmespath

@letsflow/jmespath is a **TypeScript** implementation of the [JMESPath](https://jmespath.org/) spec.

JMESPath is a query language for JSON. It will take a JSON document
as input and transform it into another JSON document
given a JMESPath expression.

This fork extends the original specs, adding the following functionality;

* [Custom functions](#custom-functions)
* [Root value access](#root-value-access)
* [Lexical scoping](#lexical-scoping)
* [Number literals](#number-literals)

Additionally, it adds the following functions:

**Array**
* [find_first](#find_first) - Find the first element in an array that matches a condition
* [find_last](#find_last) - Find the last element in an array that matches a condition
* [items](#items) - Convert an object into an array of key-value pairs
* [from_items](#from_items) - Convert an array of key-value pairs into an object
* [group_by](#group_by) - Group elements of an array based on an expression
* [zip](#zip) - Combine two arrays into an array of pairs
* [range](#range) - Generate a range of numbers or prefixed strings

**String**
* [lower](#lower) - Convert a string to lowercase
* [upper](#upper) - Convert a string to uppercase
* [pad_left](#pad_left) - Pad a string on the left
* [pad_right](#pad_right) - Pad a string on the right
* [replace](#replace) - Replace occurrences of a substring in a string
* [split](#split) - Split a string into an array by a delimiter
* [trim](#trim) - Remove leading and trailing whitespace from a string
* [trim_left](#trim_left) - Remove leading whitespace from a string
* [trim_right](#trim_right) - Remove trailing whitespace from a string

**JSON**
* [json_serialize](#json_serialize) - Serialize a JSON value to a string
* [json_parse](#json_parse) - Parse a JSON string into a JSON object

**Cryptography**
* [sha256](#sha256) - Calculate the SHA-256 hash of a string
* [sha512](#sha512) - Calculate the SHA-512 hash of a string
* [uuid](#uuid) - Generate a UUID v5

**Regex**
* [regex_test](#regex_test) - Test if a string matches a regular expression
* [regex_match](#regex_match) - Return the first match of a regular expression in a string
* [regex_match_all](#regex_match_all) - Return all matches of a regular expression in a string
* [regex_replace](#regex_replace) - Replace parts of a string matching a regular expression with a replacement string
* [regex_count](#regex_count) - Count the number of matches of a regular expression in a string

**Misc**
* [if](#if) - Conditional expression
* [get](#get) - Get a value from an object

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

### Lexical scoping

The `let` expression allows you to bind variables that are evaluated in the context of a given lexical scope. This enables queries that can refer to elements defined outside of their current element.

```javascript
search(
  {
    minimum: 2,
    items: [ 
      { name: "apple", price: 2 }, 
      { name: "banana", price: 1 }, 
      { name: "cherry", price: 3 } 
    ]
  }, 
  'let $t = minimum in items[?price >= $t].name'
)

// OUTPUTS:
// [ "apple", "cherry" ]
```

For more details, refer to [JEP-18](https://jmespath.github.io/jmespath.jep/0018-lexical-scope.html).

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

### `find_first`
**Syntax**:
```jmespath
find_first(array, condition)
```

**Description**:  
Finds the first element in `array` that satisfies `condition`. Returns `null` if no match is found.

**Example**:
```jmespath
find_first([1, 2, 3, 4], @ > 2)
// 3
```

### `find_last`
**Syntax**:
```jmespath
find_last(array, condition)
```

**Description**:  
Finds the last element in `array` that satisfies `condition`. Returns `null` if no match is found.

**Example**:
```jmespath
find_last([1, 2, 3, 4], @ > 2)
// 4
```

### `from_items`
**Syntax**:
```jmespath
from_items(array)
```

**Description**:  
Converts an array of `[key, value]` pairs into an object.

**Example**:
```jmespath
from_items([["key1", "value1"], ["key2", "value2"]])
// { "key1": "value1", "key2": "value2" }
```

### `get`
**Syntax**:
```jmespath
get(object, key, defaultValue?)
```

**Description**:
Returns the value of a key in an object.

**Example**:
```jmespath
get({ key: 'value' }, 'key')                 // "value"
get({ key: 'value' }, 'missing')             // null
get({ key: 'value' }, 'missing', 'default')  // "default"
```

### `group_by`
**Syntax**:
```jmespath
group_by(array, expression)
```

**Description**:  
Groups elements of `array` based on `expression` and returns an object where keys are unique values of `expression` and values are arrays of corresponding elements.

**Example**:
```jmespath
group_by([{id: 1, type: "A"}, {id: 2, type: "B"}, {id: 3, type: "A"}], type)
// { "A": [{id: 1, type: "A"}, {id: 3, type: "A"}], "B": [{id: 2, type: "B"}] }
```

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

### `items`
**Syntax**:
```jmespath
items(object)
```

**Description**:  
Converts an object into an array of `[key, value]` pairs.

**Example**:
```jmespath
items({ "key1": "value1", "key2": "value2" })
// [["key1", "value1"], ["key2", "value2"]]
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

### `lower`
**Syntax**:
```jmespath
lower(string)
```

**Description**:  
Converts a string to lowercase.

**Example**:
```jmespath
lower("Hello World")
// "hello world"
```

### `pad_left`
**Syntax**:
```jmespath
pad_left(string, length, char)
```

**Description**:  
Pads `string` on the left with `char` until it reaches `length`.

**Example**:
```jmespath
pad_left("42", 5, "0")
// "00042"
```

### `pad_right`
**Syntax**:
```jmespath
pad_right(string, length, char)
```

**Description**:  
Pads `string` on the right with `char` until it reaches `length`.

**Example**:
```jmespath
pad_right("42", 5, "0")
// "42000"
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

### `regex_count`
**Syntax**:
```jmespath
regex_count(regex, string)
```

**Description**:
Counts the number of matches of a regular expression in a string.

**Example**:
```jmespath
regex_count('/\\w+/g', 'hello world')
// 2
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

### `replace`
**Syntax**:
```jmespath
replace(string, search, replacement)
```

**Description**:  
Replaces occurrences of `search` with `replacement` in `string`.

**Example**:
```jmespath
replace("hello world", "world", "universe")
// "hello universe"
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

### `split`
**Syntax**:
```jmespath
split(string, delimiter)
```

**Description**:  
Splits a string into an array using `delimiter`.

**Example**:
```jmespath
split("a,b,c", ",")
// ["a", "b", "c"]
```

### `trim`
**Syntax**:
```jmespath
trim(string)
```

**Description**:  
Removes leading and trailing whitespace from `string`.

**Example**:
```jmespath
trim("  hello  ")
// "hello"
```

### `trim_left`
**Syntax**:
```jmespath
trim_left(string)
```

**Description**:  
Removes leading whitespace from `string`.

**Example**:
```jmespath
trim_left("  hello  ")
// "hello  "
```

### `trim_right`
**Syntax**:
```jmespath
trim_right(string)
```

**Description**:  
Removes trailing whitespace from `string`.

**Example**:
```jmespath
trim_right("  hello  ")
// "  hello"
```

### `upper`
**Syntax**:
```jmespath
upper(string)
```

**Description**:  
Converts a string to uppercase.

**Example**:
```jmespath
upper("Hello World")
// "HELLO WORLD"
```

### `uuid`
**Syntax**:
```jmespath
uuid(name?, namespace?)
```

**Description**:  
Generates a version 5 UUID.

UUID v5 is consistent. It creates a UUID based on the SHA hash of the input. This means that any given combination
of input and namespace will result in the same UUID, every time.

**Example**:
```jmespath
uuid('example') // v5 UUID
uuid('example', '6ba7b810-9dad-11d1-80b4-00c04fd430c8') // v5 UUID with namespace
```

`name` must be a string. Use `json_serialize()` to convert a JSON object to a string.
`namespace` must be a UUID string. By default, it uses the NIL UUID.

The UUID RFC pre-defines four namespaces

* NameSpace_DNS:  `6ba7b810-9dad-11d1-80b4-00c04fd430c8`
* NameSpace_URL:  `6ba7b811-9dad-11d1-80b4-00c04fd430c8`
* NameSpace_OID:  `6ba7b812-9dad-11d1-80b4-00c04fd430c8`
* NameSpace_X500: `6ba7b814-9dad-11d1-80b4-00c04fd430c8`

### `zip`
**Syntax**:
```jmespath
zip(array1, array2)
```

**Description**:  
Combines two arrays into an array of pairs. The resulting array length is the shorter of the two input arrays.

**Example**:
```jmespath
zip([1, 2, 3], ["a", "b", "c"])
// [[1, "a"], [2, "b"], [3, "c"]]
```

## More Resources

The example above only shows a small amount of what
a JMESPath expression can do. If you want to take a
tour of the language, the *best* place to go is the
[JMESPath Tutorial](https://jmespath.org/tutorial.html).

The full JMESPath specification can be found
on the [JMESPath site](https://jmespath.org/specification.html).
