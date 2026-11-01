import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests/browser',workers:1,reporter:'list',use:{baseURL:'http://127.0.0.1:4173',channel:process.env.CI ? undefined : 'chrome',reducedMotion:'reduce'},webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI}});
