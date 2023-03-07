import { pathToFileURL, URL } from 'url';
import path from 'path';

import sass from 'sass';

export const sassTildaImporter = {
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

export const compileCssFile = (filePath: string) => {
  try {
    const result = sass.compile(filePath, {
      importers: [sassTildaImporter],
    });
    return result.css;
  } catch (e) {
    console.log(e);
  }
};
