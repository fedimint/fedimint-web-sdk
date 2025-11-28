# Documentation Versioning Strategy

## The Problem

We're about to introduce breaking changes in v2.0.0. Users still on v1 need access to the old docs, or they'll be lost trying to follow instructions that don't match their version.

## Solutions (Pick What Works for You)

### Option 1: Git Branches (Start Here)

This is the simplest approach. Create a branch for v1 docs and deploy it separately.

```bash
git checkout -b docs/v1.0.0
git push origin docs/v1.0.0
git tag v1.0.0
git push origin v1.0.0
```

Deploy it like this:
- Main branch → `sdk.fedimint.org` (v2 docs)
- `docs/v1.0.0` branch → `v1.sdk.fedimint.org` (v1 docs)

Add a version switcher to the nav:

```typescript
nav: [
  {
    text: 'v2.0.0',
    items: [
      { text: 'v1.0.0 (Legacy)', link: 'https://v1.sdk.fedimint.org' },
      { text: 'v2.0.0 (Current)', link: '/' },
    ],
  },
  // ... rest of nav
]
```

**Good:** Works immediately, no config changes needed, clean separation

**Bad:** Need to set up a subdomain

---

### Option 2: Static Versioned Folders

Keep both versions on the same domain using path-based routing.

Run the script:
```bash
./scripts/create-version.sh
```

Result:
- `sdk.fedimint.org/` → v2 docs
- `sdk.fedimint.org/v1/` → v1 docs

**Good:** Single domain, SEO-friendly, simple to maintain

**Bad:** Manual process, need to configure paths

---

### Option 3: VitePress Versioning Plugin

This is the "proper" solution but needs more setup time. The plugin handles versioning automatically.

**Status:** Not ready yet due to compatibility issues

Use this later when you have time to set up proper infrastructure.

---

### Option 4: GitHub Actions Automation

Automated deployment whenever you create a new version tag.

The workflow file is ready at `.github/workflows/deploy-versioned-docs.yml`

**Good:** Fully automated, great for CI/CD pipelines

**Bad:** More complexity upfront

---

## What I'd Do

Go with **Option 1** right now. Here's why:

1. You can have it running in under 2 hours
2. No risky config changes
3. Easy to understand and maintain
4. If something breaks, v1 docs are completely isolated

Steps:

1. Create the branch today (commands above)
2. Deploy to `v1.sdk.fedimint.org`
3. Add the version switcher
4. Add a notice banner to v1 docs warning about the legacy version

## Files You Need

- Version banner component: `docs/.vitepress/theme/VersionNotice.vue`
- Version creation script: `scripts/create-version.sh`
- GitHub Actions workflow: `.github/workflows/deploy-versioned-docs.yml`
- This plan: `VERSIONING_PLAN.md`