# Behavior

Whether a usage CLI reading the spec parses a command line as gunshi does. `mise run fidelity:render` fills the generated block.

`differential.test.ts` gives random definitions, argv, and env to gunshi and to `usage explain` on the spec, and fails on any difference in command, values, or error. `corpus.json` records the known differences in the format of usage's [argv conformance corpus](https://github.com/jdx/usage/blob/main/corpus/README.md); `corpus.test.ts` fails if one goes away.

<!-- BEGIN corpus -->

| argv               | usage                                                                            | gunshi                                                        |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `--no-color=false` | `--no-x=false` binds x to true.                                                  | Rejects any value on the negated spelling.                    |
| `--alpha sub`      | A subcommand's flag before the subcommand belongs to the parent, which lacks it. | Binds the flag to the subcommand wherever it appears.         |
| `-ad p`            | A value-taking short flag inside a group takes the next word.                    | Gives it only the rest of the group, so its value is missing. |
| `a b c`            | A variadic positional before a required one takes every word.                    | Leaves the last word for the required positional.             |
| `-a=foo`           | A short flag takes no value after `=`.                                           | Binds the value after `=`.                                    |
| `--alpha -3`       | A value-taking flag takes a following word that starts with `-`.                 | Reads that word as a flag, so the value is missing.           |
| `--jobs nope`      | A flag value is any string; the spec has no type for flags.                      | Rejects a value that is not a number.                         |

<!-- END corpus -->
