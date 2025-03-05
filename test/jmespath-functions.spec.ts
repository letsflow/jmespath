import { describe, it, expect } from 'vitest';
import { search, registerFunction, TYPE_NUMBER } from '../src';
import { expectError } from './error.utils';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { bytesToHex } from '@noble/hashes/utils';

describe('Evaluates functions', () => {
  it('from_items()', () => {
    expect(search([], 'from_items(@)')).toEqual({});
  });
  it('from_items()', () => {
    expect(
      search(
        [
          ['foo', 'bar'],
          ['baz', 'qux'],
        ],
        'from_items(@)',
      ),
    ).toEqual({ foo: 'bar', baz: 'qux' });
  });
  it('group_by()', () => {
    expect(search([], 'group_by(@, &ignored)')).toEqual({});
  });
  it('group_by()', () => {
    const input = {
      items: [
        { spec: { nodeName: 'node_01', other: 'values_01' } },
        { spec: { nodeName: 'node_02', other: 'values_02' } },
        { spec: { nodeName: 'node_03', other: 'values_03' } },
        { spec: { nodeName: 'node_01', other: 'values_04' } },
      ],
    };
    expect(search(input, 'group_by(items, &spec.nodeName)')).toEqual({
      node_01: [
        { spec: { nodeName: 'node_01', other: 'values_01' } },
        { spec: { nodeName: 'node_01', other: 'values_04' } },
      ],
      node_02: [{ spec: { nodeName: 'node_02', other: 'values_02' } }],
      node_03: [{ spec: { nodeName: 'node_03', other: 'values_03' } }],
    });
  });
  it('items()', () => {
    expect(search({ foo: 'bar', baz: 'qux' }, 'items(@)')).toEqual([
      ['foo', 'bar'],
      ['baz', 'qux'],
    ]);
  });
  it('pad_left()', () => {
    // this should be included in the compliance test suite
    expect(search('', 'pad_left(@, `10`)')).toEqual('');
  });
  it('pad_right()', () => {
    // this should be included in the compliance test suite
    expect(search('', 'pad_right(@, `10`)')).toEqual('');
  });
  it('zip()', () => {
    expect(search([], 'zip(@)')).toEqual([]);
  });
  it('zip()', () => {
    const input = {
      people: ['Monika', 'Alice'],
      country: ['Germany', 'USA', 'France'],
    };
    expect(search(input, 'zip(people, country)')).toEqual([
      ['Monika', 'Germany'],
      ['Alice', 'USA'],
    ]);
  });
});

describe('Type-checks function arguments', () => {
  it('find_last()', () => {
    // this should be included in the compliance test suite
    expectError(() => {
      return search('subject string', "find_last(@, 's', `1.3`)");
    }, 'invalid-value');
  });
  it('from_items()', () => {
    expectError(() => {
      return search(null, 'from_items(@)');
    }, ['invalid-type', 'null']);
  });
  it('from_items()', () => {
    expectError(() => {
      return search('foo', 'from_items(@)');
    }, ['invalid-type', 'string']);
  });
  it('from_items()', () => {
    expectError(() => {
      return search([[]], 'from_items(@)');
    }, 'invalid-value');
  });
  it('from_items()', () => {
    expectError(() => {
      return search([[1, 'one']], 'from_items(@)');
    }, 'invalid-value');
  });
  it('group_by()', () => {
    expectError(() => {
      return search({}, 'group_by(@, &`false`)');
    }, 'invalid-type');
  });
  it('group_by()', () => {
    expectError(() => {
      return search([{}, {}], 'group_by(@, &`false`)');
    }, 'invalid-type');
  });
  it('group_by()', () => {
    expectError(() => {
      return search([{ a: 42 }, { a: 42 }], 'group_by(@, &a)');
    }, 'invalid-type');
  });
  it('length()', () => {
    try {
      search([], 'length(`null`)');
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).toContain('length() expected argument 1 to be type (string | array | object)');
        expect(e.message).toContain('received type null instead.');
      }
    }
  });
  it('pad_right()', () => {
    // this should be included in the compliance test suite
    expectError(() => {
      return search('subject string', "pad_right(@, `1`, '--')");
    }, 'invalid-value');
  });
});

describe('Added functions', () => {
  it('if()', () => {
    expect(search({ cond: true }, "if(@.cond, 'yes', 'no')")).toEqual('yes');
    expect(search({ cond: false }, "if(@.cond, 'yes', 'no')")).toEqual('no');
    expect(search({ cond: true }, "if(@.cond, 'ok')")).toEqual('ok');
    expect(search({ cond: false }, "if(@.cond, 'ok')")).toEqual(null);
  });

  it('get()', () => {
    expect(search({ foo: 'bar' }, "get(@, 'foo')")).toEqual('bar');
    expect(search({ foo: 'bar' }, "get(@, 'missing')")).toEqual(null);
    expect(search({ foo: 'bar' }, "get(@, 'missing', 'default')")).toEqual('default');
  });

  it('range()', () => {
    expect(search({}, 'range(5)')).toEqual([0, 1, 2, 3, 4]);
    expect(search({}, 'range(1, 5)')).toEqual([1, 2, 3, 4]);
    expect(search({}, "range(1, 5, 'item_')")).toEqual(['item_1', 'item_2', 'item_3', 'item_4']);
  });

  it('to_object()', () => {
    expect(search({}, "to_object([['key1', 'value1'], ['key2', 'value2']])")).toEqual({
      key1: 'value1',
      key2: 'value2',
    });
    expect(search(['value1', 'value2'], "to_object(zip(range(1, length(@) + 1, 'key'), @))")).toEqual({
      key1: 'value1',
      key2: 'value2',
    });
  });

  it('json_serialize()', () => {
    expect(search({ foo: 'bar' }, 'json_serialize(@)')).toEqual('{"foo":"bar"}');
  });

  it('json_parse()', () => {
    expect(search('{"foo":"bar"}', 'json_parse(@)')).toEqual({ foo: 'bar' });
  });

  it('sha256', () => {
    expect(search('hello world', 'sha256(@)')).toEqual(bytesToHex(sha256('hello world')));
  });

  it('sha512', () => {
    expect(search('hello world', 'sha512(@)')).toEqual(bytesToHex(sha512('hello world')));
  });

  it('uuid', () => {
    expect(search({}, "uuid('example')")).toEqual('feb54431-301b-52bb-a6dd-e1e93e81bb9e');
    expect(search({}, "uuid('example', '6ba7b810-9dad-11d1-80b4-00c04fd430c8')")).toEqual(
      '7cb48787-6d91-5b9f-bc60-f30298ea5736',
    );
  });

  it('regex_test', () => {
    expect(search('hello world', "regex_test('/^hello/', @)")).toEqual(true);
    expect(search('HELLO world', "regex_test('/^hello/', @)")).toEqual(false);
    expect(search('HELLO world', "regex_test('/^hello/i', @)")).toEqual(true);
  });

  it('regex_match', () => {
    expect(search('hello world', "regex_match('/^hello (\\w+)/', @)")).toEqual(['hello world', 'world']);
    expect(search('hello world', "regex_match('/\\w+/g', @)")).toEqual(['hello', 'world']);
  });

  it('regex_match_all', () => {
    const a = search('foo=24 bar=99', "regex_match_all('/(\\w+)=(\\d+)/g', @)");
    expect(a).toEqual([
      ['foo=24', 'foo', '24'],
      ['bar=99', 'bar', '99'],
    ]);
    expect(
      search('foo=24 bar=99', "regex_match_all('/(\\w+)=(\\d+)/g', @) | map(&[[1],[2]], @) | to_object(@)"),
    ).toEqual({ foo: '24', bar: '99' });
  });

  it('regex_replace', () => {
    expect(search('hello world', "regex_replace('/w\\w+d/', 'planet', @)")).toEqual('hello planet');
    expect(search('hello world', "regex_replace('/[aeoiu]/g', '*', @)")).toEqual('h*ll* w*rld');
  });
});

describe('custom functions', () => {
  it('must be in scope for let expression', () => {
    registerFunction(
      'plusplus', // FUNCTION NAME
      resolvedArgs => {
        // CUSTOM FUNCTION
        const [num] = resolvedArgs;
        return num + 1;
      },
      [{ types: [TYPE_NUMBER] }], //SIGNATURE
    );
    expect(search({ index: 0 }, 'let $n = index in plusplus($n)')).toEqual(1);
  });
});
