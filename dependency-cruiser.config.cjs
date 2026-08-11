/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "media-core-is-independent",
      comment: "media-core must not import another workspace project.",
      severity: "error",
      from: { path: "^packages/media-core/" },
      to: { path: "^(?:packages/(?!media-core/)|apps/|@media-sdk/(?!media-core(?:/|$)))" }
    },
    {
      name: "media-react-only-depends-on-core",
      comment: "media-react may only cross project boundaries to media-core.",
      severity: "error",
      from: { path: "^packages/media-react/" },
      to: { path: "^(?:packages/(?!media-(?:core|react)/)|apps/|@media-sdk/(?!media-(?:core|react)(?:/|$)))" }
    },
    {
      name: "media-native-only-depends-on-core",
      comment: "media-native may only cross project boundaries to media-core.",
      severity: "error",
      from: { path: "^packages/media-native/" },
      to: { path: "^(?:packages/(?!media-(?:core|native)/)|apps/|@media-sdk/(?!media-(?:core|native)(?:/|$)))" }
    },
    {
      name: "media-ui-react-is-independent",
      comment: "media-ui-react must not depend on core, platform, or native UI packages.",
      severity: "error",
      from: { path: "^packages/media-ui-react/" },
      to: { path: "^(?:packages/media-(?:core|react|native|ui-native)/|@media-sdk/media-(?:core|react|native|ui-native)(?:/|$))" }
    },
    {
      name: "media-ui-native-is-independent",
      comment: "media-ui-native must not depend on core, platform, or React UI packages.",
      severity: "error",
      from: { path: "^packages/media-ui-native/" },
      to: { path: "^(?:packages/media-(?:core|react|native|ui-react)/|@media-sdk/media-(?:core|react|native|ui-react)(?:/|$))" }
    },
    {
      name: "web-app-only-uses-react-packages",
      comment: "web-app may only depend on media-react and media-ui-react workspace packages.",
      severity: "error",
      from: { path: "^apps/web-app/" },
      to: { path: "^(?:packages/(?!media-(?:react|ui-react)/)|@media-sdk/(?!media-(?:react|ui-react)(?:/|$)))" }
    }
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(?:^|/)dist/|(?:^|/)node_modules/" },
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: { exportsFields: ["exports"] }
  }
};
