import { describe, expect, it } from 'vitest';

import { findDuplicates, findDuplicatesInDir, getDuplicates, resolveScssImport } from "../src";


const sharedMock = {
  filePath: 'test/mock/shared.scss',
  imports: [],
  selectors: ['.shared'],
};

const itemMock = {
  filePath: 'test/mock/item.scss',
  imports: ['./shared'],
  selectors: ['.item-button', '.nested .nested2'],
};

const fileSelectorsMock = [
  sharedMock,
  {
    filePath: 'test/mock/not-duplicated.scss',
    imports: ['./shared'],
    selectors: ['.new-item'],
  },
  {
    filePath: 'test/mock/nex-item.scss',
    imports: ['./shared'],
    selectors: ['.item-button', '.nested .nested2'],
  },
  itemMock,
];

const resultMock = {
  '.item-button': new Set(['test/mock/item.scss', 'test/mock/nex-item.scss']),
  '.nested .nested2': new Set([
    'test/mock/item.scss',
    'test/mock/nex-item.scss',
  ]),
};

describe('duplicated-css-selectors', () => {
  it('getDuplicates', async () => {
    expect(await getDuplicates()).toEqual(resultMock);
  });

  it('findDuplicatesInDir', async () => {
    expect(await findDuplicatesInDir()).toEqual(fileSelectorsMock);
  });

  it('findDuplicates', async () => {
    expect(findDuplicates(fileSelectorsMock)).toEqual(resultMock);
  });

  it('resolveImports', () => {
    expect(resolveScssImport('./shared', 'test/mock/item.scss')).toEqual(
      'test/mock/shared.scss',
    );
  });

  it('resolveImports node', () => {
    expect(resolveScssImport('~@ux/intents/lib/index', 'test/mock/item.scss')).toEqual(
      'node_modules/@ux/intents/lib/index.scss',
    );
  });

  it('resolveImports node', () => {
    expect(resolveScssImport('global', 'test/mock/item.scss')).toEqual(
      'styles/_global.scss',
    );
  });
});
