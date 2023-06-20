import * as cssTree from 'css-tree';
import { Raw, SelectorList } from 'css-tree';

function isRaw(pet: Raw | SelectorList): pet is Raw {
  return (pet as Raw).value !== undefined;
}

export const getCssSelectors = (css: string) => {
  const ast = cssTree.parse(css, {
    parseAtrulePrelude: false,
    parseRulePrelude: false,
    parseValue: false,
  });
  const selectors: string[] = [];
  cssTree.walk(ast, function (node) {
    if (node.type === 'Rule' && isRaw(node.prelude)) {
      selectors.push(node.prelude?.value);
    }
  });
  return selectors;
};
