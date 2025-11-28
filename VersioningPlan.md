# Fedimint SDK Documentation Versioning Strategy

## 🎯 **Problem**

You need to preserve current documentation before implementing major breaking changes in v2.0.0.

## 🚀 **Recommended Solutions** (in priority order)

### **Option 1: Git-Based Versioning (⭐ RECOMMENDED - Quick & Simple)**

**Best for:** Immediate implementation with minimal setup

**Steps:**

1. **Create version branch:**

   ```bash
   git checkout -b docs/v1.0.0
   git push origin docs/v1.0.0
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Deploy strategy:**
   - Main branch → `sdk.fedimint.org` (v2.0.0)
   - `docs/v1.0.0` branch → `v1.sdk.fedimint.org` (v1.0.0)

3. **Add version switcher to nav:**
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

**Pros:** ✅ Zero config changes ✅ Works immediately ✅ Clear separation
**Cons:** ❌ Requires separate subdomain deployment

---

### **Option 2: Manual Static Versioning (Good for same-domain deployment)**

**Best for:** When you want both versions on the same domain

**Implementation:**

```bash
# Run the provided script
./scripts/create-version.sh
```

**Result:**

- `sdk.fedimint.org/` → v2.0.0 (latest)
- `sdk.fedimint.org/v1/` → v1.0.0 (legacy)

**Pros:** ✅ Same domain ✅ SEO-friendly paths ✅ Easy maintenance
**Cons:** ❌ Manual process ❌ Requires path configuration

---

### **Option 3: VitePress Versioning Plugin (Most Professional)**

**Best for:** Long-term documentation versioning strategy

**Status:** 🚧 Requires more setup due to compatibility issues

**When to use:** Consider this for future versions when you have more time to set up proper versioning infrastructure.

---

### **Option 4: GitHub Actions Automation (For CI/CD enthusiasts)**

**Best for:** Automated deployment of versioned docs

**Features:**

- Automatic deployment on tags
- Version index page
- Configurable deployment paths

**Setup:** Use the provided `.github/workflows/deploy-versioned-docs.yml`

---

## 🎯 **My Strong Recommendation**

**For immediate implementation before your v2.0.0 release:**

1. **Use Option 1 (Git-based)** - It's the fastest and most reliable
2. **Create the version branch TODAY:**
   ```bash
   git checkout -b docs/v1.0.0
   git push origin docs/v1.0.0
   ```
3. **Set up subdomain deployment** (v1.sdk.fedimint.org)
4. **Add version notice component** to current docs
5. **Document the strategy** for your team

**Timeline:** Can be implemented in < 2 hours

## 📋 **Next Steps**

### Immediate (Today):

- [ ] Create `docs/v1.0.0` branch
- [ ] Push branch to repository
- [ ] Tag the current state as v1.0.0

### This Week:

- [ ] Set up subdomain deployment for v1.0.0 docs
- [ ] Add version switcher to main docs
- [ ] Test both versions work correctly

### Future:

- [ ] Consider implementing VitePress Versioning Plugin for v3.0.0+
- [ ] Set up automated versioning with GitHub Actions
- [ ] Create migration guides between versions

## 💡 **Additional Benefits**

1. **SEO Protection:** Old documentation URLs remain accessible
2. **User Experience:** Users can reference legacy docs during migration
3. **Team Productivity:** Developers can work on v2.0.0 docs without breaking current users
4. **Professional Image:** Shows maturity in handling breaking changes

## 🔗 **Quick Links**

- Version notice component: `docs/.vitepress/theme/VersionNotice.vue`
- Versioning script: `scripts/create-version.sh`
- GitHub Actions workflow: `.github/workflows/deploy-versioned-docs.yml`
- This plan: `VERSIONING_PLAN.md`
