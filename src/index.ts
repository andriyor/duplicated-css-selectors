import path from 'path';
import { readFileSync } from 'fs';

import { glob } from "glob";
import { difference } from 'set-fns';

import { compileCssFile } from './compile-css-file';
import { getCssSelectors } from './get-css-selectors';
import { getScssImports } from './get-scss-imports';

type FileSelectors = {
  filePath: string;
  selectors: string[];
  imports: string[];
};

type SelectorFiles = Record<string, Set<string>>;

export const findDuplicates = (fileSelectors: FileSelectors[]) => {
  const selectorFiles: SelectorFiles = {};
  for (const fileSelector of fileSelectors) {
    for (const selector of fileSelector.selectors) {
      for (const fileSelector2 of fileSelectors) {
        if (fileSelector.filePath !== fileSelector2.filePath) {
          if (fileSelector2.selectors.includes(selector)) {
            if (selectorFiles[selector]) {
              selectorFiles[selector].add(fileSelector.filePath);
              selectorFiles[selector].add(fileSelector2.filePath);
            } else {
              selectorFiles[selector] = new Set([
                fileSelector.filePath,
                fileSelector2.filePath,
              ]);
            }
          }
        }
      }
    }
  }
  return selectorFiles;
};

const report = (selectorFiles: SelectorFiles) => {
  console.log('');
  console.log(
    `Found ${Object.keys(selectorFiles).length} duplicated css selector`
  );
  console.log('');
  for (const selectorFilesKey in selectorFiles) {
    console.log(
      `Selector ${selectorFilesKey} exist on ${selectorFiles[selectorFilesKey].size} files`
    );
    for (const file of selectorFiles[selectorFilesKey]) {
      console.log(file);
    }
    console.log('');
  }
};

export const resolveScssImport = (importName: string, fromPath: string) => {
  if (importName.includes('@')) {
    const withoutTilda = importName.replace('~', '');
    const filePath = withoutTilda.includes('.scss')
      ? withoutTilda
      : `${withoutTilda}.scss`;
    return path.join('node_modules', filePath);
  }
  if (importName.includes('.scss')) {
    return path.relative(
      process.cwd(),
      path.resolve(path.dirname(fromPath), importName)
    );
  }
  if (!importName.includes('./') && importName.includes('/')) {
    return path.join(`${importName}.scss`);
  }
  if (!importName.includes('./')) {
    return path.join('styles', `_${importName}.scss`);
  }
  const relativePath = path.relative(
    process.cwd(),
    path.resolve(path.dirname(fromPath), importName)
  );
  return `${relativePath}.scss`;
};

const getFilesSelector = (filePaths: string[]) => {
  const allImportSelectors: string[] = [];
  for (const filePath of filePaths) {
    const css = compileCssFile(filePath);
    if (css) {
      const selectors = getCssSelectors(css);
      allImportSelectors.push(...selectors);
    }
  }
  return allImportSelectors;
};

export const findDuplicatesInDir = async () => {
  const files = await glob('**/*.scss', { ignore: 'node_modules/**' })
  const fileClasses: FileSelectors[] = [];
  for (const fileName of files) {
    const css = compileCssFile(fileName);
    const scssFile = readFileSync(fileName, 'utf-8');
    const imports = await getScssImports(scssFile);
    const resolvedImports = imports.map((importName) =>
      resolveScssImport(importName, fileName)
    );
    const selectorsFromImports = getFilesSelector(resolvedImports);
    if (css) {
      const selectors = getCssSelectors(css);
      const onlyDirectSelectors = [
        ...difference(selectors, selectorsFromImports),
      ];
      fileClasses.push({
        filePath: fileName,
        selectors: onlyDirectSelectors,
        imports,
      });
    }
  }
  return fileClasses;
};

export const getDuplicates = async () => {
  const fileClasses = await findDuplicatesInDir();
  return findDuplicates(fileClasses);
};

(async () => {
  const duplicates = await getDuplicates();
  report(duplicates);
})();
