import next from 'eslint-config-next/core-web-vitals';
import ts from 'eslint-config-next/typescript';

const eslintConfig = [
  ...next,
  ...ts,
  // .claude/ holds agent worktrees (full repo copies) that shouldn't be linted from the root.
  { ignores: ['.next/**', 'node_modules/**', '.claude/**'] },
];

export default eslintConfig;
