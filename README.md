# tree-sitter-12dmtf

tree-sitter grammar for 12d Model **MTF** files (`.mtf`, `.mtf_seed`), **boxing** files (`.bf`) and **MTF snippets** (`.mtfsnippet`). Grammar name `om_12dmtf`.

These are line-oriented text files, so the grammar is deliberately loose: a line is a block header (`left_side = {` or `boxing "std kerb" {`), an assignment (`section_width = 2.5`), a snippet directive (`@ def_tok NQM $(NQ)`), a command (`width "kerb" 103 203.0 0.0 3.0 absolute`) or a row (`150 std`), with arguments in any order. 12d checks the commands; this only has to colour and outline them.

- `// PARAMETER NAME TYPE "description" default` and `// INFO`, `// DISPLAY`, `// INCREMENT`, ... lines are their own node kinds (`parameter_comment`, `meta_comment`); other `//` comments are `line_comment`.
- `$(NAME)`, `$(P[2:4])`, `$NAME` and `$null` are `token_ref`, also inside strings.
- Known limits: the keyword in `// INFO` / `// PARAMETER` is matched without a word boundary (tree-sitter regexes have none), so `// INFORMATION ...` is read as `// INFO` + text. Files are expected in UTF-8; 12d writes `.mtf` and `.bf` as UTF-16 with a BOM, which the editor has to decode.

```
npm install
npx tree-sitter generate
npx tree-sitter parse test/sample.mtfsnippet
```

Checked against 129 files: the 12dSkill examples and library, and every `.mtfsnippet`, `.MTFSNIPPET`, `.mtf_seed` and `.bf` in a 12d 15.0 install's `library` folder (converted from UTF-16 for the test). All parse without errors.

## Licence

MIT, see [LICENSE](LICENSE). Independent project, not affiliated with or endorsed by 12d Solutions.
