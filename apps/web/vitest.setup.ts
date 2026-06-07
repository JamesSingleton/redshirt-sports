import "@testing-library/jest-dom/vitest";

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project-id";
process.env.NEXT_PUBLIC_SANITY_DATASET ??= "production";
process.env.SANITY_API_READ_TOKEN ??= "test-token";
