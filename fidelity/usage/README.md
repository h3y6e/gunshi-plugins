# Fidelity

How faithfully the [usage](https://usage.jdx.dev) spec from gunshi-plugin-usage describes a gunshi CLI.

```mermaid
flowchart LR
  gunshi --> plugin["@h3y6e/gunshi-plugin-usage"]
  cobra --> cobra_usage
  plugin --> spec["usage KDL spec"]
  cobra_usage --> spec
  spec --> consumers["usage CLI: completions, docs, explain"]
```

- [Coverage](coverage/README.md): which spec keys the plugin writes, compared with cobra_usage
- [Behavior](behavior/README.md): whether usage reads command lines as gunshi does
