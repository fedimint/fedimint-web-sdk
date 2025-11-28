<template>
  <div class="version-notice">
    <div class="notice-content">
      <span class="notice-icon">⚠️</span>
      <div class="notice-text">
        <strong>Version Notice:</strong> You're viewing documentation for
        Fedimint SDK v1.0.0.
        <a href="#" class="version-link">Upgrade to v2.0.0 →</a>
      </div>
    </div>
  </div>
</template>

<script setup>
// This component shows version notices
</script>

<style scoped>
.version-notice {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 16px 0;
  font-size: 14px;
}

.notice-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notice-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.notice-text {
  flex: 1;
}

.version-link {
  color: #d97706;
  font-weight: 600;
  text-decoration: none;
}

.version-link:hover {
  text-decoration: underline;
}

/* Dark mode */
.dark .version-notice {
  background: linear-gradient(135deg, #451a03, #78350f);
  border-color: #f59e0b;
}

.dark .version-link {
  color: #fbbf24;
}
</style>
