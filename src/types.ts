export type TreeNode<T> = {
  value: T;
  children: Array<TreeNode<T>>;
};
