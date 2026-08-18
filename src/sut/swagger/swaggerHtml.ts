/**
 * Returns an interactive Swagger UI HTML page embedding or referencing the given OpenAPI spec.
 */
export function renderSwaggerUiHtml(specTitle: string, specYamlContent: string): string {
  const jsonContent = JSON.stringify(specYamlContent);

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${specTitle} — Interactive API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
  <script>
    window.onload = function() {
      const rawSpec = ${jsonContent};
      let parsedSpec;
      try {
        parsedSpec = jsyaml.load(rawSpec);
      } catch (e) {
        console.error('Failed to parse YAML spec', e);
      }

      window.ui = SwaggerUIBundle({
        spec: parsedSpec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
}
