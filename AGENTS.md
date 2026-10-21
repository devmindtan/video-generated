# Video playground

The project's installed agent skills are in `skills/` (21 skills from the three upstream skill repositories). Before creating or editing a video, read `skills/remotion-best-practices/SKILL.md` and the relevant referenced rules. For Motion or GSAP tasks, read `skills/motion/SKILL.md` or the relevant `skills/gsap-*/SKILL.md`.

Skills are stored here because the environment protects `.agents/` and `.codex/` from writes. This file makes the local skill location explicit for agents working in this project.

Application source lives in `src/`. `repos/` contains shallow upstream clones for reference; do not modify them when implementing a video. Use installed npm packages in the root application. `repos-manifest.json` records upstream revisions.

Use `npm run dev` for preview, `npm run typecheck` for TypeScript validation, and `npm run render` for a sample MP4. Animation must derive from the Remotion frame so preview, seeking and rendering agree. Browser animation loops need frame synchronization before use in rendered video.
