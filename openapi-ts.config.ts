import { defineConfig } from '@hey-api/openapi-ts';

// Types and Zod schemas generated from the backend contract (openapi/openapi.json). Do not edit the output by hand:
// run `npm run gen:api` after the contract changes.
export default defineConfig({
  input: './openapi/openapi.json',
  output: { path: './src/app/core/api/generated' },
  plugins: [
    '@hey-api/typescript',
    // The backend sends timestamps with their offset (2026-10-21T21:04:05+00:00)
    { name: 'zod', dates: { offset: true } },
  ],
});
