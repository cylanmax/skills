# Skills

Reusable skills for coding agents, published in the open [Agent Skills](https://agentskills.io) format.

## Install

Install one skill globally for all agents supported by the Skills CLI:

```bash
npx skills add cylanmax/skills --skill react-formatted-input --global --agent '*' --yes
```

The `--skill` option selects the skill by its frontmatter name. The repository keeps skills under `skills/<skill-name>/SKILL.md` with any supporting assets beside it.

## Update

Update the installed global copy of a skill:

```bash
npx skills update react-formatted-input --global --yes
```

## Available skills

- [`react-formatted-input`](skills/react-formatted-input/SKILL.md): IME-safe formatted inputs and searchable React select components.
