import type { RepoContext } from '../core/repo.ts';
import type { Syntax, TSNode } from '../core/syntax.ts';

/**
 * Task names a Rakefile or `.rake` file defines, read from its Ruby syntax tree: `task :name`,
 * `task name: deps`, `task 'name'`, tasks inside `namespace :x do … end` (as `x:name`), task classes
 * such as `RuboCop::RakeTask.new(:name)`, and names a `%i[a b].each do |t| task t` loop generates.
 */
export async function rakeTasks(syntax: Syntax, repo: RepoContext, file: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const tree = await syntax.tree(file);
  if (!tree) {
    // No grammar: line patterns, without namespaces.
    (repo.read(file) ?? '').split('\n').forEach((l, i) => {
      const m = /\btask\s*\(?\s*[:"']?([\w:-]+)/.exec(l) ?? /Task\.new\(\s*:(\w+)/.exec(l);
      if (m?.[1] && !out.has(m[1])) out.set(m[1], i + 1);
    });
    return out;
  }
  const symbolText = (n: TSNode | null | undefined): string | null => {
    if (!n) return null;
    if (n.type === 'simple_symbol') return n.text.replace(/^:/, '');
    if (n.type === 'string' || n.type === 'bare_symbol' || n.type === 'bare_string') return n.text.replace(/^["':]|["']$/g, '');
    return null;
  };
  // Names an identifier takes in an enclosing `%i[a b].each do |id|` loop.
  const loopValues = (id: string, node: TSNode): string[] => {
    for (let anc = node.parent; anc; anc = anc.parent) {
      if (anc.type !== 'call' || anc.childForFieldName('method')?.text !== 'each') continue;
      const params = anc.childForFieldName('block')?.namedChildren.find((c) => c.type === 'block_parameters');
      if (!params?.namedChildren.some((p) => p.text === id)) continue;
      const receiver = anc.childForFieldName('receiver');
      if (receiver && /array/.test(receiver.type)) return receiver.namedChildren.map((e) => symbolText(e) ?? e.text.replace(/^["':]|["']$/g, ''));
    }
    return [];
  };
  const visit = (node: TSNode, prefix: string[]): void => {
    if (node.type === 'call') {
      const method = node.childForFieldName('method')?.text;
      const args = node.childForFieldName('arguments')?.namedChildren ?? [];
      const first = args[0];
      const block = node.childForFieldName('block');
      if (method === 'namespace') {
        const ns = symbolText(first);
        if (ns && block) {
          for (const c of block.namedChildren) visit(c, [...prefix, ns]);
          return;
        }
      }
      const names: string[] = [];
      if (method === 'task' && first) {
        const direct = symbolText(first);
        if (direct) names.push(direct);
        else if (first.type === 'pair') {
          const key = first.childForFieldName('key');
          const k = symbolText(key) ?? key?.text.replace(/:$/, '');
          if (k) names.push(k);
        } else if (first.type === 'hash') {
          const key = first.namedChildren[0]?.childForFieldName('key');
          const k = symbolText(key) ?? key?.text.replace(/:$/, '');
          if (k) names.push(k);
        } else if (first.type === 'identifier') names.push(...loopValues(first.text, node));
      }
      // `RuboCop::RakeTask.new(:internal_investigation)`, `Rake::TestTask.new(:test)`.
      if (method === 'new' && /Task$/.test(node.childForFieldName('receiver')?.text ?? '')) {
        const n = symbolText(first);
        if (n) names.push(n);
      }
      for (const n of names) {
        const full = [...prefix, n].join(':');
        if (!out.has(full)) out.set(full, node.startPosition.row + 1);
      }
    }
    for (const c of node.namedChildren) visit(c, prefix);
  };
  visit(tree.rootNode, []);
  return out;
}
