import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../../apps/api/openapi/openapi.json",
  output: {
    path: "../../apps/web/src/generated/api",
    // Workaround: the bundled client does not compile under exactOptionalPropertyTypes.
    header: ({ defaultValue }) => [...defaultValue, "// @ts-nocheck"],
  },
  plugins: ["@hey-api/client-fetch", "@hey-api/typescript", "@hey-api/sdk"],
});
