const { existsSync } = require('fs');
const { readJson } = require('fs-extra');
const path = require('path');
const YAML = require('json-to-pretty-yaml');

const express = require('express');

const router = express.Router();
const { getSwaggerSpec, getOpenApi } = require('./swaggerSpec');

module.exports = router;
module.exports.getSwaggerSpec = getSwaggerSpec;
module.exports.getOpenApi = getOpenApi;

module.exports.initSwagger = async ({
  apiDocsPath = '',
  appVersion, baseUrl, appName, additionalSwaggerPaths = [],
}) => {
  let swaggerSpec;
  const existingSwagger = path.resolve(__dirname, 'swagger.json');
  if (existsSync(existingSwagger)) {
    swaggerSpec = await readJson(existingSwagger);
  } else {
    swaggerSpec = await getSwaggerSpec({
      appVersion, baseUrl, appName, additionalSwaggerPaths,
    });
    // Add custom base path
    if (swaggerSpec.paths) {
      Object.keys(swaggerSpec.paths).forEach((key) => {
        const backup = swaggerSpec.paths[key];
        delete swaggerSpec.paths[key];
        swaggerSpec.paths[`${apiDocsPath}/${key}`.replace('//', '/')] = backup;
      });
    }
  }
  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>Adw API Swagger</title>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
      <link rel="stylesheet" href="https://raw.githubusercontent.com/oqo0/swagger-themes/main/SwaggerThemes/Themes/_base.css">
      <link rel="stylesheet" href="https://raw.githubusercontent.com/oqo0/swagger-themes/main/SwaggerThemes/Themes/monokai.css">
      <link href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" rel="shortcut icon" type="image/x-icon">
      <style>
      body {
        font-family: sans-serif;
        color: #3b4151;
      }

        /* primary colors */
    
        .swagger-ui .topbar .download-url-wrapper .select-label select {
            border: 2px solid var(--swagger-color);
        }
    
        .swagger-ui .info .title small.version-stamp {
            background-color: var(--swagger-color);
        }
    
        .swagger-ui .info a {
            color: var(--link-color);
        }
    
        .swagger-ui .response-control-media-type--accept-controller select {
            border-color: var(--accept-header-color);
        }
    
        .swagger-ui .response-control-media-type__accept-message {
            color: var(--accept-header-color);
        }
    
        .swagger-ui .btn.authorize {
            color: var(--post-method-color);
        }
    
        .swagger-ui .btn.authorize {
            border-color: var(--post-method-color);
        }
    
        .swagger-ui .btn.authorize svg {
            fill: var(--post-method-color);
        }
    
        /* methods colors */
        /* http post */
    
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background: var(--post-method-color);
        }
    
        .swagger-ui .opblock.opblock-post .opblock-summary {
            border-color: var(--post-method-color);
        }
    
        .swagger-ui .opblock.opblock-post {
            background: var(--post-method-background-color);
            border-color: var(--post-method-color);
        }
    
        .swagger-ui .opblock.opblock-post .opblock-summary {
          background: linear-gradient(90deg, rgb(43 43 43) 0%, var(--post-method-color) 100%);
        }
        .swagger-ui .opblock.opblock-put .opblock-summary {
          background: linear-gradient(90deg, rgb(43 43 43) 0%, var(--put-method-color) 100%);
        }

        .swagger-ui .opblock.opblock-patch .opblock-summary {
          background: linear-gradient(90deg, rgb(43 43 43) 0%, var(--patch-method-color) 100%);
        }

        .swagger-ui .opblock.opblock-delete .opblock-summary {
          background: linear-gradient(90deg, rgb(43 43 43) 0%, var(--delete-method-color) 100%);
        }
        .swagger-ui .opblock.opblock-get .opblock-summary {
          background: linear-gradient(90deg, rgb(43 43 43) 0%, var(--get-method-color) 100%);
        }
        .swagger-ui .opblock.opblock-options .opblock-summary {
          background: linear-gradient(90deg, rgb(43 43 43) 0%, var(--options-method-color) 100%);
        }
        .swagger-ui .opblock.opblock-post .tab-header .tab-item.active h4 span::after {
            background: var(--post-method-color);
        }
        .swagger-ui .opblock {
          overflow: hidden;
        }
    
        /* http get */
    
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background: var(--get-method-color);
        }
    
        .swagger-ui .opblock.opblock-get .opblock-summary {
            border-color: var(--get-method-color);
        }
    
        .swagger-ui .opblock.opblock-get {
            background: var(--get-method-background-color);
            border-color: var(--get-method-color);
        }
    
        .swagger-ui .opblock.opblock-get .tab-header .tab-item.active h4 span::after {
            background: var(--get-method-color);
        }
    
        /* http head */
    
        .swagger-ui .opblock.opblock-head .opblock-summary-method {
            background: var(--head-method-color);
        }
    
        .swagger-ui .opblock.opblock-head .opblock-summary {
            border-color: var(--head-method-color);
        }
    
        .swagger-ui .opblock.opblock-head {
            background: var(--head-method-background-color);
            border-color: var(--head-method-color);
        }
    
        .swagger-ui .opblock.opblock-head .tab-header .tab-item.active h4 span::after {
            background: var(--head-method-color);
        }
    
        /* http put */
    
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
            background: var(--put-method-color);
        }
    
        .swagger-ui .opblock.opblock-put .opblock-summary {
            border-color: var(--put-method-color);
        }
    
        .swagger-ui .opblock.opblock-put {
            background: var(--put-method-background-color);
            border-color: var(--put-method-color);
        }
    
        .swagger-ui .opblock.opblock-put .tab-header .tab-item.active h4 span::after {
            background: var(--put-method-color);
        }
    
        /* http delete */
    
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
            background: var(--delete-method-color);
        }
    
        .swagger-ui .opblock.opblock-delete .opblock-summary {
            border-color: var(--delete-method-color);
        }
    
        .swagger-ui .opblock.opblock-delete {
            background: var(--delete-method-background-color);
            border-color: var(--delete-method-color);
        }
    
        .swagger-ui .opblock.opblock-delete .tab-header .tab-item.active h4 span::after {
            background: var(--delete-method-color);
        }
    
        /* http options */
    
        .swagger-ui .opblock.opblock-options .opblock-summary-method {
            background: var(--options-method-color);
        }
    
        .swagger-ui .opblock.opblock-options .opblock-summary {
            border-color: var(--options-method-color);
        }
    
        .swagger-ui .opblock.opblock-options {
            background: var(--options-method-background-color);
            border-color: var(--options-method-color);
        }
    
        .swagger-ui .opblock.opblock-options .tab-header .tab-item.active h4 span::after {
            background: var(--options-method-color);
        }
    
        /* http patch */
    
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
            background: var(--patch-method-color);
        }
    
        .swagger-ui .opblock.opblock-patchs .opblock-summary {
            border-color: var(--patch-method-color);
        }
    
        .swagger-ui .opblock.opblock-patch {
            background: var(--patch-method-background-color);
            border-color: var(--patch-method-color);
        }
    
        .swagger-ui .opblock.opblock-patch .tab-header .tab-item.active h4 span::after {
            background: var(--patch-method-color);
        }
    
        /* blocks */
        body {
            background-color: var(--all-bg-color);
            color: white;
        }
    
        .swagger-ui .topbar {
            background-color: var(--header-bg-color);
        }
    
        .swagger-ui .scheme-container {
            background: var(--secondary-bg-color);
        }
    
        .swagger-ui section.models .model-container {
            background: var(--secondary-bg-color);
            border-radius: var(--innner-block-border-radius);
        }
    
        .swagger-ui select {
            background: var(--selecter-bg-color);
            border-radius: var(--block-border-radius);
            color: var(--primary-text-color);
        }
    
        .swagger-ui section.models {
            border: 1px solid var(--block-border-color);
            background-color: var(--block-bg-color);
        }
    
        .swagger-ui .opblock .opblock-section-header {
            background: var(--secondary-bg-color);
        }
    
        .swagger-ui .body-param__example {
            background-color: var(--secondary-bg-color) !important;
            border-radius: var(--block-border-radius) !important;
        }
    
        .swagger-ui .example {
            background-color: var(--secondary-bg-color) !important;
            border-radius: var(--block-border-radius) !important;
        }
    
        .swagger-ui .copy-to-clipboard {
            background: rgba(255, 255, 255, var(--icons-opacity));
            border-radius: var(--block-border-radius);
        }
    
        .swagger-ui .opblock .opblock-summary-method {
            border-radius: var(--innner-block-border-radius);
        }
    
        .swagger-ui select[multiple],
        .swagger-ui input[type="email"],
        .swagger-ui input[type="file"],
        .swagger-ui input[type="password"],
        .swagger-ui input[type="search"],
        .swagger-ui input[type="text"],
        .swagger-ui textarea {
            background: var(--secondary-bg-color);
            border: 1px solid var(--block-border-color);
            border-radius: var(--block-border-radius);
            color: var(--primary-text-color);
            outline: none;
        }
    
        .swagger-ui .dialog-ux .modal-ux-header {
            border-bottom: 1px solid var(--block-border-color);
        }
    
        .swagger-ui .btn {
            border: 2px solid var(--block-border-color);
            border-radius: var(--block-border-radius);
            color: var(--primary-text-color);
        }
    
        .swagger-ui .dialog-ux .modal-ux {
            background: var(--block-bg-color);
            border: 1px solid var(--block-border-color);
            border-radius: var(--block-border-radius);
        }
    
        .swagger-ui .auth-btn-wrapper {
            justify-content: left;
        }
    
        .swagger-ui .opblock-tag {
            border-bottom: 1px solid var(--block-border-color);
        }
    
        .swagger-ui section.models.is-open h4 {
            border-bottom: 1px solid var(--block-border-color);
        }
    
        .swagger-ui .opblock {
            border-radius: var(--block-border-radius);
        }
    
        .swagger-ui section.models {
            border-radius: var(--block-border-radius);
        }
    
        /* button white outline fix */
    
        .swagger-ui .model-box-control:focus,
        .swagger-ui .models-control:focus,
        .swagger-ui .opblock-summary-control:focus {
            outline: none;
        }
    
        /* icons */
    
        .swagger-ui .model-toggle::after {
            opacity: var(--icons-opacity);
            filter: var(--black-icons-filter);
        }
    
        .swagger-ui svg:not(:root) {
            fill: var(--primary-icon-color);
        }
    
        .swagger-ui .opblock-summary-control svg:not(:root) {
            opacity: var(--secondary-icon-opacity);
        }
    
        /* text */
    
        .swagger-ui {
            color: var(--primary-text-color);
        }
        .swagger-ui .opblock .opblock-summary-description {
          color: white;
        }
        .swagger-ui .scheme-container {
          padding: 0;
        }
        .swagger-ui .info .title {
            color: var(--primary-text-color);
        }
    
        .swagger-ui a.nostyle {
            color: var(--primary-text-color) !important;
        }
    
        .swagger-ui .model-title {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .models-control {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .dialog-ux .modal-ux-header h3 {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .dialog-ux .modal-ux-content h4 {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .dialog-ux .modal-ux-content p {
            color: var(--secondary-text-color);
        }
    
        .swagger-ui label {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .opblock .opblock-section-header h4 {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .tab li button.tablinks {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .opblock-description-wrapper p,
        .swagger-ui .opblock-external-docs-wrapper p,
        .swagger-ui .opblock-title_normal p {
            color: var(--primary-text-color);
        }
    
        .swagger-ui table thead tr td, .swagger-ui table thead tr th {
            border-bottom: 1px solid var(--block-border-color);
            color: var(--primary-text-color);
        }
    
        .swagger-ui .response-col_status {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .response-col_links {
            color: var(--secondary-text-color);
        }
    
        .swagger-ui .parameter__name {
            color: var(--primary-text-color);
        }
    
        .swagger-ui .parameter__type {
            color: var(--secondary-text-color);
        }
    
        .swagger-ui .prop-format {
            color: var(--secondary-text-color);
        }
    
        .swagger-ui .info li,
        .swagger-ui .info p,
        .swagger-ui .info table {
            color: var(--secondary-text-color);
        }
    
        .swagger-ui .model {
            color: var(--secondary-text-color);
        }
        .swagger-ui .info {
          margin: 10px 0;
        }
        .header {
          max-width: 1460px;
          margin: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header input {
          background: var(--secondary-bg-color);
          border-radius: var(--block-border-radius);
          color: var(--primary-text-color);
          outline: none;
          border: 2px solid #d8dde7;
          margin: 20px 0;
          padding: 10px;
        }
        .clabroche-title {
          font-size: 2em;
          margin-left: 20px;
        }
        .swagger-ui {
          color: white
        }
        .swagger-ui .opblock .opblock-summary-path-description-wrapper {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-direction: column;
        }

        .swagger-ui .info h1,
        .swagger-ui .info h2,
        .swagger-ui .info h3,
        .swagger-ui .info h4,
        .swagger-ui .info h5
        {
          color: var(--primary-text-color) !important;
        }

        .swagger-ui blockquote {
          background-color: var(--header-bg-color);
          padding: 0 10px;
          box-sizing: border-box;
          display: inline-block;
          width: 100%;
          margin: 10px 0;
          border-left: 12px solid var(--block-bg-color);

        }

:root {
    /* primary colors */
    --swagger-color: #59ab37;
    --link-color: #86E1F4;
    --accept-header-color: #34A05E;

    /* methods colors */
    --post-method-color: #1c9700;
    --post-method-background-color: rgba(0, 0, 0, .4);
    --get-method-color: #009d83;
    --get-method-background-color: rgba(0, 0, 0, .4);
    --head-method-color: #F87FBD;
    --head-method-background-color: rgba(0, 0, 0, .4);
    --put-method-color: #e0a44e;
    --put-method-background-color: rgba(0, 0, 0, .4);
    --delete-method-color: #e85858;
    --delete-method-background-color: rgba(0, 0, 0, .4);
    --options-method-color: rgb(64, 145, 225);
    --options-method-background-color: rgba(0, 0, 0, .4);
    --patch-method-color: rgb(229, 178, 38);
    --patch-method-background-color: rgba(0, 0, 0, .4);

    /* background */
    --all-bg-color: #282A36;
    --secondary-bg-color: #282A35;
    --header-bg-color: #3A3D4C;
    --block-bg-color: #414450;
    --selecter-bg-color: #3A3D4C;

    /* text */
    --primary-text-color: rgba(255, 255, 255, 1.00);
    --secondary-text-color: rgba(193, 192, 192, 1.00);

    /* border */
    --block-border-color: rgba(255, 255, 255, 0.08);
    --block-border-radius: 12px;
    --innner-block-border-radius: 8px;

    /* icons */
    --primary-icon-color: #ffffff;
    --icons-opacity: 0;
    --secondary-icon-opacity: .6;
    --black-icons-filter: invert(1);
}
      </style>
    </head>
    <body>
      <div class="header">
        <h2 class="clabroche-title">Documentation Clabroche</h2>
        <input oninput="onFilter()" id="addw-filter" placeholder="Filter...">
      </div>
      <div id="swagger"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
      <script>
      function onFilter() {
        const $input = document.querySelector('#addw-filter')
        const $inputReal = document.querySelector('.operation-filter-input')
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,"value"
        ).set;
        nativeInputValueSetter.call($inputReal, $input.value)
        const inputEvent = new Event("input", { bubbles: true });
        $inputReal.dispatchEvent(inputEvent);
      }
        const filterOnAllPlugin = (system) => {
          return {
            fn: {
              opsFilter: (taggedOps, phrase) => {
                document.querySelectorAll('.opblock').forEach($op => {
                  if($op?.style) {
                    $op.style.display = 'none'
                  } 
                })
                const spec = JSON.parse(system.spec().get('spec'))
                const paths = Object.keys(spec.paths)
                let additionnal = []
                let operationIds = []
                function add(pathSpecs, method, path) {
                  additionnal.push(...pathSpecs[method].tags)
                  pathSpecs[method].tags.forEach(tag => {
                    const operationId = pathSpecs[method].operationId || ('operations-'+ tag + '-' + method + path).replaceAll('/', '_').replaceAll('{', '_').replaceAll(' ', '_').replaceAll('}', '_')
                    if(!operationIds.includes(operationId)) operationIds.push(operationId)
                  })
                }
                paths.forEach(path => {
                  const pathSpecs = spec.paths[path]
                  const methods = Object.keys(pathSpecs)
                  methods.forEach(method => {
                    const {summary, description, tags } = pathSpecs[method]
                    if(summary?.toLowerCase().includes(phrase?.toLowerCase())) add(pathSpecs, method, path)
                    if(description?.toLowerCase().includes(phrase?.toLowerCase())) add(pathSpecs, method, path)
                    if(path?.toLowerCase().includes(phrase?.toLowerCase())) add(pathSpecs, method, path)
                    tags.forEach(tag => {
                      if(tag?.toLowerCase().includes(phrase?.toLowerCase())) add(pathSpecs, method, path)
                    })
                  })
                })
                operationIds.forEach(opId => {
                  const $op = document.querySelector('#' + opId)
                  if($op?.style) {
                    $op.style.display = 'block'
                  } 
                })
                return taggedOps.filter((tagObj, tag) => {
                  return additionnal.includes(tag)
                });
              }
            }
          }
        }
        const openapiJSONPath = document.location.pathname.split('/api-docs')[0] + '/swagger.json';
        SwaggerUIBundle({
          dom_id: '#swagger',
          url: openapiJSONPath,
          explorer: false,
          deepLinking: true,
          defaultModelsExpandDepth: -1,
          displayRequestDuration: true,
          persistAuthorization: true,
          onComplete() {
            const filterInput = document.querySelector('.operation-filter-input')
            filterInput.style.display= 'none'
            filterInput.addEventListener('input', ()=> {
              if(!filterInput.value) {
                document.querySelectorAll('.opblock').forEach($op => {
                  if($op?.style) {
                    $op.style.display = 'block'
                  } 
                })
              }
            })
          },
          filter: true,
          responseInterceptor: (response) => {
            axios.post(\`${apiDocsPath}/api-docs/transform-response-to-yml\`, response.body)
              .then(({data: yml}) => {
                const result = document.querySelector('.response-col_description .microlight')
                const element = result.cloneNode(true)
                element.classList.add('schema-swagger')
                const h5 = document.createElement('h5')
                h5.innerHTML = 'Response Schema'
                h5.classList.add('schema-swagger')
                const code = element.querySelector('code')
                code.innerHTML = yml
                const parent = document.querySelector('.response-col_description .microlight').parentElement
                parent.append(h5)
                parent.append(element)
                const perf = document.createElement('div')
                perf.classList.add('schema-swagger')
                perf.innerHTML = Math.floor(timing) + 'ms'
                document.querySelector('.responses-inner')
                  .prepend(perf)
              })
            return response
          },
          syntaxHighlight: {
            theme: 'monokai',
          },
          plugins: [
            filterOnAllPlugin,
          ],
          presets: [
            SwaggerUIBundle.presets.apis,
          ],
          layout: "BaseLayout"
        });
      </script>
    </body>
  </html>`;
  router.post(`${apiDocsPath}/api-docs/transform-response-to-yml`, (req, res) => {
    res.set('Content-Security-Policy', '');
    res.set('Cross-Origin-Opener-Policy', '');
    res.set('Cross-Origin-Resource-Policy', '');
    res.set('Cross-Origin-Embedder-Policy', '');

    function getJSONResponseSpec(value, objRes = {}) {
      const objectType = typeof value;
      if (value == null) {
        objRes.type = 'string';
        objRes.nullable = true;
      } else if (Array.isArray(value)) {
        objRes.type = 'array';
        objRes.items = {};
        getJSONResponseSpec(value[0], objRes.items);
      } else if (objectType === 'object') {
        objRes.type = 'object';
        objRes.properties = {};
        mapOnKeys(value, (key, value) => {
          objRes.properties[key] = {};
          getJSONResponseSpec(value, objRes.properties[key]);
        });
      } else {
        objRes.type = typeof value;
      }
      return objRes;
    }

    function mapOnKeys(object, cb) {
      Object.keys(object).map((key) => cb(key, object[key]));
    }
    const json = getJSONResponseSpec(req.body || {});
    const data = YAML.stringify(json);

    res.json(data);
  });
  router.use([`${apiDocsPath}/api-docs`, `${apiDocsPath}/api-docs/*`], (req, res) => {
    res.set('Content-Security-Policy', '');
    res.set('Cross-Origin-Opener-Policy', '');
    res.set('Cross-Origin-Resource-Policy', '');
    res.set('Cross-Origin-Embedder-Policy', '');
    res.send(html);
  });

  // router.use(`${apiDocsPath}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  router.get(`${apiDocsPath}/swagger.json`, async (_req, res) => {
    res.json(swaggerSpec);
  });
};
