import path from 'path';
import { pathToFileURL, URL } from 'url';

import fg from 'fast-glob';
import sass from 'sass';
import cssTree from 'css-tree';

type FileSelectors = {
  file: string;
  selectors: string[];
};

type SelectorFiles = Record<string, Set<string>>;

const sassTildaImporter = {
  findFileUrl(url: string) {
    if (url.includes('@')) {
      if (!url.startsWith('~')) {
        return new URL(
          pathToFileURL(
            path.join(process.cwd(), 'node_modules', url)
          ).toString()
        );
      }
      return new URL(
        pathToFileURL(
          path.join(process.cwd(), 'node_modules', url.substring(1))
        ).toString()
      );
    }
    return new URL(pathToFileURL(path.join(process.cwd(), url)).toString());
  },
};

const findDuplicates = (fileSelectors: FileSelectors[]) => {
  const selectorFiles: SelectorFiles = {};
  for (const fileSelector of fileSelectors) {
    for (const selector of fileSelector.selectors) {
      for (const fileSelector2 of fileSelectors) {
        if (fileSelector.file !== fileSelector2.file) {
          if (fileSelector2.selectors.includes(selector)) {
            if (selectorFiles[selector]) {
              selectorFiles[selector].add(fileSelector.file);
              selectorFiles[selector].add(fileSelector2.file);
            } else {
              selectorFiles[selector] = new Set([
                fileSelector.file,
                fileSelector2.file,
              ]);
            }
          }
        }
      }
    }
  }
  return selectorFiles;
};

const compileCssFile = (filePath: string) => {
  try {
    const result = sass.compile(filePath, {
      importers: [sassTildaImporter],
    });
    return result.css;
  } catch (e) {
    console.log(e);
  }
};

const getCssSelectors = (css: string) => {
  const ast = cssTree.parse(css, {
    parseAtrulePrelude: false,
    parseRulePrelude: false,
    parseValue: false,
  });
  const selectors: string[] = [];
  cssTree.walk(ast, function (node) {
    if (node.type === 'Rule') {
      // @ts-ignore
      selectors.push(node.prelude?.value);
    }
  });
  return selectors;
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

(async () => {
  const files = await fg('**/*.scss', { ignore: ['node_modules/**'] });
  const fileClasses: FileSelectors[] = [];
  for (const file of files) {
    const css = compileCssFile(file);
    if (css) {
      const selectors = getCssSelectors(css);
      fileClasses.push({
        file,
        selectors,
      });
    }
  }
  const duplicates = findDuplicates(fileClasses);
  report(duplicates);
})();
