/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */

export default function jsonStringify(data: any): string | undefined {
  const seen: any[] = [];

  function stringifyNode(node: any): string | undefined {
    if (node && typeof node.toJSON === 'function') {
      node = node.toJSON();
    }

    if (node === undefined) {
      return;
    }
    if (typeof node === 'number') {
      return isFinite(node) ? String(node) : 'null';
    }
    if (typeof node !== 'object') {
      return JSON.stringify(node);
    }

    if (Array.isArray(node)) {
      const arrayOutput = node.map(item => stringifyNode(item) || 'null').join(',');
      return `[${arrayOutput}]`;
    }

    if (node === null) {
      return 'null';
    }

    if (seen.includes(node)) {
      throw new TypeError('Converting circular structure to JSON');
    }

    const seenIndex = seen.push(node) - 1;
    const keys = Object.keys(node).sort();
    const objectOutput = keys
      .map(key => {
        const value = stringifyNode(node[key]);
        return value ? `${JSON.stringify(key)}:${value}` : undefined;
      })
      .filter(entry => entry !== undefined)
      .join(',');

    seen.splice(seenIndex, 1);
    return `{${objectOutput}}`;
  }

  return stringifyNode(data);
}
