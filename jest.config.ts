import type { Config } from "jest";

const shared: Config = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^server-only$": "<rootDir>/__mocks__/server-only.ts",
  },
};

const config: Config = {
  projects: [
    {
      ...shared,
      displayName: "unit",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__tests__/unit/**/*.test.ts"],
    },
    {
      ...shared,
      displayName: "integration",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],
    },
    {
      ...shared,
      displayName: "ui",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/__tests__/ui/**/*.test.tsx"],
      setupFilesAfterEnv: ["<rootDir>/__tests__/setup/jest-dom.ts"],
    },
  ],
};

export default config;
