import Table from "cli-table";

import { TreeNode } from "@project/ui/types";

/**
 * Formats a table with dynamic column widths.
 */
export function table(options: {
  headers: string[];
  data: string[][];
}): string {
  const table = new Table({
    head: options.headers,
  });
  table.push(...options.data);
  return table.toString();
}

/**
 * Formats a tree of strings.
 *
 * @param root Root node
 */
export function tree(root: TreeNode<string>): string {
  let lines: string[] = [];

  function fn(node: TreeNode<string>, level: number): void {
    // format line
    let line: string = "";
    for (let i = 0; i < level; i++) {
      line += "│ ";
    }
    line += `└── ${node.value}`;
    lines.push(line);

    // recursively format children
    for (const child of node.children) {
      fn(child, level + 1);
    }
  }

  // format root and direct children of root
  lines.push(root.value);
  for (const child of root.children) {
    fn(child, 0);
  }

  // return lines
  return lines.join("\n");
}
