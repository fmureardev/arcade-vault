# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform for playing games online and competing for high scores (see README.md, in Spanish). This is a very early-stage Next.js 16 (App Router) project, currently just the `create-next-app` scaffold with no custom features implemented yet.

The project follows **Spec Driven Design** via the `/spec` and `/spec-impl` skills from the `Klerith/fernando-skills` skill pack (installed with `npx skills@latest add Klerith/fernando-skills`). If a feature spec exists, prefer running the spec workflow over ad-hoc implementation.

## Skills
Usa siempre /frontend-design para diseñar la interfaz del usuario.

## Stack notes

- Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS v4 (via `@tailwindcss/postcss`, no `tailwind.config`).
- Path alias `@/*` maps to the repo root (see `tsconfig.json`).
- Since this Next.js version deviates from the training-data version, consult `node_modules/next/dist/docs/` before using any Next.js API you're not certain about — see AGENTS.md above.
