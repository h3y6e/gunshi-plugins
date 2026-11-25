# Coverage

Which keys of the [usage](https://usage.jdx.dev) spec gunshi-plugin-usage writes. `mise run fidelity:render` fills the generated blocks.

## gunshi properties

`mapping.ts` compares specs with and without each property of gunshi's `ArgSchema`, `Command`, and `CliOptions`. "spelling only": names or values change, but no key is added.

Every spec also has:

<!-- BEGIN base -->

`arg.double_dash`, `arg.hide`, `cmd.arg`, `cmd.effect`, `cmd.flag`, `cmd.help`, `cmd.hide`, `flag.action`, `flag.builtin`, `flag.help`, `spec.arg`, `spec.bin`, `spec.cmd`, `spec.disable_help`, `spec.disable_version_flag`, `spec.flag`, `spec.name`, `spec.subcommand_negates_reqs`, `spec.unknown_flags`
<!-- END base -->

<!-- BEGIN properties -->

| Property                             | Key                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ArgSchema.type`                     | `cmd.arg`, `cmd.flag`, `flag.bool_value`, `spec.arg`, `spec.flag`                                                                                      |
| `ArgSchema.short`                    | spelling only                                                                                                                                          |
| `ArgSchema.description`              | `arg.help`, `flag.help`                                                                                                                                |
| `ArgSchema.hidden`                   | `arg.hide`, `flag.hide`                                                                                                                                |
| `ArgSchema.metavar`                  | spelling only                                                                                                                                          |
| `ArgSchema.multiple`                 | `flag.var`                                                                                                                                             |
| `ArgSchema.negatable`                | `flag.negate`                                                                                                                                          |
| `ArgSchema.parse`                    | —                                                                                                                                                      |
| `ArgSchema.required`                 | `flag.required`                                                                                                                                        |
| `ArgSchema.default`                  | `arg.default`, `flag.default`                                                                                                                          |
| `ArgSchema.choices`                  | `flag.choices`                                                                                                                                         |
| `ArgSchema.conflicts`                | `flag.conflicts`                                                                                                                                       |
| `ArgSchema.toKebab`                  | spelling only                                                                                                                                          |
| `ArgSchema.deprecated`               | —                                                                                                                                                      |
| `Command.name`                       | —                                                                                                                                                      |
| `Command.description`                | `cmd.help`                                                                                                                                             |
| `Command.args`                       | `cmd.flag`, `spec.flag`                                                                                                                                |
| `Command.examples`                   | `cmd.example`, `spec.example`                                                                                                                          |
| `Command.run`                        | —                                                                                                                                                      |
| `Command.toKebab`                    | spelling only                                                                                                                                          |
| `Command.internal`                   | `cmd.hide`                                                                                                                                             |
| `Command.aliases`                    | —                                                                                                                                                      |
| `Command.deprecated`                 | —                                                                                                                                                      |
| `Command.passthrough`                | —                                                                                                                                                      |
| `Command.entry`                      | —                                                                                                                                                      |
| `Command.rendering`                  | —                                                                                                                                                      |
| `Command.subCommands`                | `arg.double_dash`, `arg.hide`, `cmd.arg`, `cmd.cmd`, `cmd.flag`, `cmd.subcommand_negates_reqs`, `flag.action`, `flag.builtin`, `flag.help`, `spec.cmd` |
| `CliOptions.cwd`                     | —                                                                                                                                                      |
| `CliOptions.name`                    | spelling only                                                                                                                                          |
| `CliOptions.description`             | `spec.about`                                                                                                                                           |
| `CliOptions.version`                 | `spec.version`                                                                                                                                         |
| `CliOptions.subCommands`             | `arg.double_dash`, `arg.hide`, `cmd.arg`, `cmd.flag`, `flag.action`, `flag.builtin`, `flag.help`, `spec.cmd`                                           |
| `CliOptions.leftMargin`              | —                                                                                                                                                      |
| `CliOptions.middleMargin`            | —                                                                                                                                                      |
| `CliOptions.usageOptionType`         | —                                                                                                                                                      |
| `CliOptions.usageOptionValue`        | —                                                                                                                                                      |
| `CliOptions.usageSilent`             | —                                                                                                                                                      |
| `CliOptions.strict`                  | spelling only                                                                                                                                          |
| `CliOptions.strictPositionals`       | —                                                                                                                                                      |
| `CliOptions.helpHint`                | —                                                                                                                                                      |
| `CliOptions.validationErrorExitCode` | —                                                                                                                                                      |
| `CliOptions.renderUsage`             | —                                                                                                                                                      |
| `CliOptions.renderHeader`            | —                                                                                                                                                      |
| `CliOptions.renderValidationErrors`  | —                                                                                                                                                      |
| `CliOptions.fallbackToEntry`         | `arg.hide`, `spec.arg`                                                                                                                                 |
| `CliOptions.plugins`                 | `arg.double_dash`, `arg.hide`, `cmd.arg`, `cmd.flag`, `flag.action`, `flag.builtin`, `flag.help`, `spec.cmd`, `spec.flag`                              |
| `CliOptions.onBeforeCommand`         | —                                                                                                                                                      |
| `CliOptions.onAfterCommand`          | —                                                                                                                                                      |
| `CliOptions.onErrorCommand`          | —                                                                                                                                                      |

<!-- END properties -->

## Plugin metadata

The same comparison for what the plugins add to gunshi's definitions: `withUsage`, `ArgSchema.complete`, and the options of `usage()` from gunshi-plugin-usage, and `ArgSchema.env` from gunshi-plugin-env.

<!-- BEGIN plugin -->

| Property                       | Key                                                   |
| ------------------------------ | ----------------------------------------------------- |
| `UsageMeta.effect`             | `cmd.effect`                                          |
| `UsageMeta.longDescription`    | `cmd.long_help`, `spec.long_about`                    |
| `UsageMeta.subcommandRequired` | `cmd.subcommand_required`                             |
| `UsageMeta.outputs`            | `cmd.output`, `spec.output`                           |
| `UsageMeta.exitCodes`          | `cmd.exit_code`, `spec.exit_code`                     |
| `UsageOutput.description`      | `output.help`                                         |
| `UsageOutput.default`          | `output.default`                                      |
| `UsageOutput.hidden`           | `output.hide`                                         |
| `UsageOutput.mediaType`        | `output.media_type`                                   |
| `UsageOutput.framing`          | `output.framing`                                      |
| `UsageOutput.select`           | `output.select`                                       |
| `UsageOutput.schema`           | `output.schema`                                       |
| `UsageOptions.name`            | spelling only                                         |
| `UsageOptions.description`     | spelling only                                         |
| `UsageOptions.flagsets`        | `cmd.use`, `flagset.flag`, `spec.flagset`, `spec.use` |
| `UsageOptions.declaredOnly`    | `flag.global`                                         |
| `ArgSchema.complete`           | `arg.complete`, `flag.complete`                       |
| `ArgSchema.env`                | `flag.env`                                            |

<!-- END plugin -->

## usage keys

Keys the usage parser accepts, as `node.key` (`spec` is the top level). The cobra_usage column comes from its KDL writer via `mise run fidelity:vocabulary`.

<!-- BEGIN keys -->

[usage 6.12.1](https://github.com/jdx/usage/blob/4de083709ddf5f54ecf5f85cc1c21e7fd0388228/lib/src/spec) · [cobra_usage](https://github.com/jdx/usage/blob/4de083709ddf5f54ecf5f85cc1c21e7fd0388228/integrations/cobra/kdl.go)

| Key                                    | gunshi-plugin-usage (57/306) | cobra_usage (43/306) |
| -------------------------------------- | ---------------------------- | -------------------- |
| `arg.allow_negative_numbers`           | —                            | —                    |
| `arg.available_if`                     | —                            | —                    |
| `arg.choices`                          | —                            | carried              |
| `arg.complete`                         | carried                      | —                    |
| `arg.conflicts`                        | —                            | —                    |
| `arg.default`                          | carried                      | carried              |
| `arg.delimiter`                        | —                            | —                    |
| `arg.deprecated_env`                   | —                            | —                    |
| `arg.display_order`                    | —                            | —                    |
| `arg.double_dash`                      | carried                      | —                    |
| `arg.effect`                           | —                            | —                    |
| `arg.env`                              | —                            | —                    |
| `arg.env_fallback`                     | —                            | —                    |
| `arg.help`                             | carried                      | carried              |
| `arg.help_heading`                     | —                            | —                    |
| `arg.help_long`                        | —                            | —                    |
| `arg.help_md`                          | —                            | —                    |
| `arg.hide`                             | carried                      | carried              |
| `arg.hide_default_value`               | —                            | —                    |
| `arg.hide_env`                         | —                            | —                    |
| `arg.hide_env_values`                  | —                            | —                    |
| `arg.hide_long_help`                   | —                            | —                    |
| `arg.hide_possible_values`             | —                            | —                    |
| `arg.hide_short_help`                  | —                            | —                    |
| `arg.long_help`                        | —                            | —                    |
| `arg.note`                             | —                            | —                    |
| `arg.required`                         | —                            | carried              |
| `arg.required_if`                      | —                            | —                    |
| `arg.required_if_eq`                   | —                            | —                    |
| `arg.required_if_eq_all`               | —                            | —                    |
| `arg.required_unless`                  | —                            | —                    |
| `arg.required_unless_all`              | —                            | —                    |
| `arg.requires`                         | —                            | —                    |
| `arg.sigil`                            | —                            | —                    |
| `arg.surface`                          | —                            | —                    |
| `arg.validate`                         | —                            | —                    |
| `arg.validate_error`                   | —                            | —                    |
| `arg.value_names`                      | —                            | —                    |
| `arg.value_terminator`                 | —                            | —                    |
| `arg.var`                              | —                            | carried              |
| `arg.var_max`                          | —                            | —                    |
| `arg.var_min`                          | —                            | —                    |
| `arg.warning`                          | —                            | —                    |
| `choices.env`                          | —                            | —                    |
| `choices.help`                         | —                            | —                    |
| `choices.hide`                         | —                            | —                    |
| `choices.ignore_case`                  | —                            | —                    |
| `choices.run`                          | —                            | —                    |
| `choices.strict`                       | —                            | —                    |
| `choices.unstable_choices_env`         | —                            | —                    |
| `clause.arg`                           | —                            | —                    |
| `clause.flag`                          | —                            | —                    |
| `clause.help`                          | —                            | —                    |
| `clause.help_long`                     | —                            | —                    |
| `clause.long_help`                     | —                            | —                    |
| `clause.separator`                     | —                            | —                    |
| `cmd.after_help`                       | —                            | —                    |
| `cmd.after_help_long`                  | —                            | —                    |
| `cmd.after_help_md`                    | —                            | —                    |
| `cmd.after_long_help`                  | —                            | —                    |
| `cmd.alias`                            | —                            | carried              |
| `cmd.allow_missing_positional`         | —                            | —                    |
| `cmd.arg`                              | carried                      | carried              |
| `cmd.arg_required_else_help`           | —                            | —                    |
| `cmd.args_conflicts_with_subcommands`  | —                            | —                    |
| `cmd.args_override_self`               | —                            | —                    |
| `cmd.available_if`                     | —                            | —                    |
| `cmd.before_help`                      | —                            | —                    |
| `cmd.before_help_long`                 | —                            | —                    |
| `cmd.before_help_md`                   | —                            | —                    |
| `cmd.before_long_help`                 | —                            | —                    |
| `cmd.clause`                           | —                            | —                    |
| `cmd.cmd`                              | carried                      | carried              |
| `cmd.complete`                         | —                            | —                    |
| `cmd.deprecated`                       | —                            | carried              |
| `cmd.deprecated_remove_at`             | —                            | —                    |
| `cmd.deprecated_warn_at`               | —                            | —                    |
| `cmd.disable_help_flag`                | —                            | —                    |
| `cmd.disable_help_subcommand`          | —                            | —                    |
| `cmd.disable_version_flag`             | —                            | —                    |
| `cmd.display_order`                    | —                            | —                    |
| `cmd.dont_delimit_trailing_values`     | —                            | —                    |
| `cmd.effect`                           | carried                      | —                    |
| `cmd.example`                          | carried                      | carried              |
| `cmd.example.header`                   | —                            | carried              |
| `cmd.example.help`                     | —                            | carried              |
| `cmd.example.lang`                     | —                            | carried              |
| `cmd.exit_code`                        | carried                      | —                    |
| `cmd.external_subcommand`              | —                            | —                    |
| `cmd.flag`                             | carried                      | carried              |
| `cmd.flatten_help`                     | —                            | —                    |
| `cmd.group`                            | —                            | —                    |
| `cmd.heading`                          | —                            | —                    |
| `cmd.heading.help`                     | —                            | —                    |
| `cmd.help`                             | carried                      | carried              |
| `cmd.help_heading`                     | —                            | —                    |
| `cmd.help_long`                        | —                            | —                    |
| `cmd.help_md`                          | —                            | —                    |
| `cmd.hide`                             | carried                      | carried              |
| `cmd.long_help`                        | carried                      | carried              |
| `cmd.max_term_width`                   | —                            | —                    |
| `cmd.mount`                            | —                            | —                    |
| `cmd.next_line_help`                   | —                            | —                    |
| `cmd.output`                           | carried                      | —                    |
| `cmd.restart_token`                    | —                            | —                    |
| `cmd.select`                           | —                            | —                    |
| `cmd.subcommand_help_heading`          | —                            | —                    |
| `cmd.subcommand_negates_reqs`          | carried                      | —                    |
| `cmd.subcommand_precedence_over_arg`   | —                            | —                    |
| `cmd.subcommand_required`              | carried                      | carried              |
| `cmd.subcommand_value_name`            | —                            | —                    |
| `cmd.surface`                          | —                            | —                    |
| `cmd.term_width`                       | —                            | —                    |
| `cmd.unknown_flags`                    | —                            | —                    |
| `cmd.use`                              | carried                      | —                    |
| `complete.delegate`                    | —                            | —                    |
| `complete.descriptions`                | —                            | —                    |
| `complete.run`                         | —                            | —                    |
| `complete.type`                        | —                            | —                    |
| `config.alias`                         | —                            | —                    |
| `config.choices`                       | —                            | —                    |
| `config.choices.help`                  | —                            | —                    |
| `config.cli`                           | —                            | —                    |
| `config.data_type`                     | —                            | —                    |
| `config.default`                       | —                            | —                    |
| `config.default_note`                  | —                            | —                    |
| `config.deprecated`                    | —                            | —                    |
| `config.deprecated_env`                | —                            | —                    |
| `config.deprecated_remove_at`          | —                            | —                    |
| `config.deprecated_warn_at`            | —                            | —                    |
| `config.env`                           | —                            | —                    |
| `config.example`                       | —                            | —                    |
| `config.file`                          | —                            | —                    |
| `config.file.findup`                   | —                            | —                    |
| `config.file.format`                   | —                            | —                    |
| `config.file.scope`                    | —                            | —                    |
| `config.help`                          | —                            | —                    |
| `config.help_heading`                  | —                            | —                    |
| `config.hide`                          | —                            | —                    |
| `config.long_help`                     | —                            | —                    |
| `config.merge`                         | —                            | —                    |
| `config.optional`                      | —                            | —                    |
| `config.parse`                         | —                            | —                    |
| `config.prop`                          | —                            | —                    |
| `config.renamed_to`                    | —                            | —                    |
| `config.scope`                         | —                            | —                    |
| `config.since`                         | —                            | —                    |
| `config.source`                        | —                            | —                    |
| `config.source.doc_hint`               | —                            | —                    |
| `config.source.name`                   | —                            | —                    |
| `config.source.set_hint`               | —                            | —                    |
| `config.type`                          | —                            | —                    |
| `config.writes_to`                     | —                            | —                    |
| `config.x`                             | —                            | —                    |
| `flag.action`                          | carried                      | —                    |
| `flag.alias`                           | —                            | —                    |
| `flag.allow_hyphen_values`             | —                            | —                    |
| `flag.allow_negative_numbers`          | —                            | —                    |
| `flag.arg`                             | —                            | carried              |
| `flag.available_if`                    | —                            | —                    |
| `flag.bool_value`                      | carried                      | —                    |
| `flag.builtin`                         | carried                      | —                    |
| `flag.choices`                         | carried                      | carried              |
| `flag.complete`                        | carried                      | —                    |
| `flag.conflicts`                       | carried                      | —                    |
| `flag.count`                           | —                            | carried              |
| `flag.default`                         | carried                      | carried              |
| `flag.default_if`                      | —                            | —                    |
| `flag.default_missing`                 | —                            | —                    |
| `flag.delimiter`                       | —                            | —                    |
| `flag.deprecated`                      | —                            | carried              |
| `flag.deprecated_env`                  | —                            | —                    |
| `flag.deprecated_remove_at`            | —                            | —                    |
| `flag.deprecated_warn_at`              | —                            | —                    |
| `flag.display_order`                   | —                            | —                    |
| `flag.effect`                          | —                            | —                    |
| `flag.env`                             | carried                      | —                    |
| `flag.env_fallback`                    | —                            | —                    |
| `flag.exclusive`                       | —                            | —                    |
| `flag.global`                          | carried                      | carried              |
| `flag.help`                            | carried                      | carried              |
| `flag.help_heading`                    | —                            | —                    |
| `flag.help_long`                       | —                            | —                    |
| `flag.help_md`                         | —                            | —                    |
| `flag.hide`                            | carried                      | carried              |
| `flag.hide_default_value`              | —                            | —                    |
| `flag.hide_env`                        | —                            | —                    |
| `flag.hide_env_values`                 | —                            | —                    |
| `flag.hide_long_help`                  | —                            | —                    |
| `flag.hide_possible_values`            | —                            | —                    |
| `flag.hide_short_help`                 | —                            | —                    |
| `flag.long_help`                       | —                            | carried              |
| `flag.negate`                          | carried                      | —                    |
| `flag.note`                            | —                            | —                    |
| `flag.overrides`                       | —                            | —                    |
| `flag.require_equals`                  | —                            | —                    |
| `flag.required`                        | carried                      | carried              |
| `flag.required_if`                     | —                            | —                    |
| `flag.required_if_eq`                  | —                            | —                    |
| `flag.required_if_eq_all`              | —                            | —                    |
| `flag.required_unless`                 | —                            | —                    |
| `flag.required_unless_all`             | —                            | —                    |
| `flag.requires`                        | —                            | —                    |
| `flag.requires_if`                     | —                            | —                    |
| `flag.surface`                         | —                            | —                    |
| `flag.value_optional`                  | —                            | —                    |
| `flag.value_terminator`                | —                            | —                    |
| `flag.var`                             | carried                      | carried              |
| `flag.var_max`                         | —                            | —                    |
| `flag.var_min`                         | —                            | —                    |
| `flag.warning`                         | —                            | —                    |
| `flagset.arg`                          | —                            | —                    |
| `flagset.flag`                         | carried                      | —                    |
| `flagset.use`                          | —                            | —                    |
| `group.flag`                           | —                            | —                    |
| `group.multiple`                       | —                            | —                    |
| `group.required`                       | —                            | —                    |
| `mount.overrides_default`              | —                            | —                    |
| `mount.run`                            | —                            | —                    |
| `mount.synopsis`                       | —                            | —                    |
| `output.default`                       | carried                      | —                    |
| `output.framing`                       | carried                      | —                    |
| `output.help`                          | carried                      | —                    |
| `output.hide`                          | carried                      | —                    |
| `output.media_type`                    | carried                      | —                    |
| `output.schema`                        | carried                      | —                    |
| `output.select`                        | carried                      | —                    |
| `spec.about`                           | carried                      | carried              |
| `spec.about_long`                      | —                            | —                    |
| `spec.about_md`                        | —                            | —                    |
| `spec.after_help`                      | —                            | —                    |
| `spec.after_help_long`                 | —                            | —                    |
| `spec.after_long_help`                 | —                            | —                    |
| `spec.allow_missing_positional`        | —                            | —                    |
| `spec.arg`                             | carried                      | carried              |
| `spec.arg_required_else_help`          | —                            | —                    |
| `spec.args_conflicts_with_subcommands` | —                            | —                    |
| `spec.args_override_self`              | —                            | —                    |
| `spec.author`                          | —                            | —                    |
| `spec.available_if`                    | —                            | —                    |
| `spec.before_help`                     | —                            | —                    |
| `spec.before_help_long`                | —                            | —                    |
| `spec.before_long_help`                | —                            | —                    |
| `spec.bin`                             | carried                      | carried              |
| `spec.clause`                          | —                            | —                    |
| `spec.cmd`                             | carried                      | carried              |
| `spec.complete`                        | —                            | —                    |
| `spec.config`                          | —                            | —                    |
| `spec.default_subcommand`              | —                            | —                    |
| `spec.default_subcommand_flags`        | —                            | —                    |
| `spec.default_subcommand_help`         | —                            | —                    |
| `spec.default_subcommand_on_empty`     | —                            | —                    |
| `spec.deprecated`                      | —                            | —                    |
| `spec.deprecated_remove_at`            | —                            | —                    |
| `spec.deprecated_warn_at`              | —                            | —                    |
| `spec.disable_help`                    | carried                      | —                    |
| `spec.disable_help_flag`               | —                            | —                    |
| `spec.disable_help_subcommand`         | —                            | —                    |
| `spec.disable_version_flag`            | carried                      | —                    |
| `spec.dont_delimit_trailing_values`    | —                            | —                    |
| `spec.example`                         | carried                      | carried              |
| `spec.example.header`                  | —                            | carried              |
| `spec.example.help`                    | —                            | carried              |
| `spec.example.lang`                    | —                            | carried              |
| `spec.exit_code`                       | carried                      | —                    |
| `spec.external_subcommand`             | —                            | —                    |
| `spec.flag`                            | carried                      | carried              |
| `spec.flagset`                         | carried                      | —                    |
| `spec.flatten_help`                    | —                            | —                    |
| `spec.group`                           | —                            | —                    |
| `spec.heading`                         | —                            | —                    |
| `spec.heading.help`                    | —                            | —                    |
| `spec.help_template`                   | —                            | —                    |
| `spec.include`                         | —                            | —                    |
| `spec.license`                         | —                            | —                    |
| `spec.logo`                            | —                            | —                    |
| `spec.logo.style`                      | —                            | —                    |
| `spec.long_about`                      | carried                      | carried              |
| `spec.long_version`                    | —                            | —                    |
| `spec.max_term_width`                  | —                            | —                    |
| `spec.min_usage_version`               | —                            | —                    |
| `spec.mount`                           | —                            | —                    |
| `spec.multicall`                       | —                            | —                    |
| `spec.name`                            | carried                      | carried              |
| `spec.next_line_help`                  | —                            | —                    |
| `spec.output`                          | carried                      | —                    |
| `spec.repository`                      | —                            | —                    |
| `spec.select`                          | —                            | —                    |
| `spec.source_code_link_template`       | —                            | —                    |
| `spec.subcommand_help_heading`         | —                            | —                    |
| `spec.subcommand_negates_reqs`         | carried                      | —                    |
| `spec.subcommand_precedence_over_arg`  | —                            | —                    |
| `spec.subcommand_required`             | —                            | —                    |
| `spec.subcommand_value_name`           | —                            | —                    |
| `spec.surface`                         | —                            | —                    |
| `spec.term_width`                      | —                            | —                    |
| `spec.unknown_flags`                   | carried                      | —                    |
| `spec.usage`                           | —                            | carried              |
| `spec.use`                             | carried                      | —                    |
| `spec.version`                         | carried                      | carried              |
| `spec.view`                            | —                            | —                    |
| `view.bin`                             | —                            | —                    |
| `view.global`                          | —                            | —                    |
| `view.globals`                         | —                            | —                    |
| `view.name`                            | —                            | —                    |
| `view.root`                            | —                            | —                    |

<!-- END keys -->
