import postcss from 'postcss';
import postcssScss from 'postcss-scss';

export const trimQuotes = (str: string) => {
  return str.slice(1, -1);
};

export const getScssImports = async (scssFile: string) => {
  const result = await postcss().process(scssFile, { syntax: postcssScss });
  const fileImports: string[] = [];
  result.root.walk((node) => {
    if (node.type === 'atrule' && node.name === 'import') {
      fileImports.push(trimQuotes(node.params));
    }
  });
  return fileImports;
};
