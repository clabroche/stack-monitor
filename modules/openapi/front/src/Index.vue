<template>
  <section-cmp :key="service?.label">
    <div :id="id" :class="{dark}"></div>
  </section-cmp>
</template>

<script setup>
import SwaggerUi from 'swagger-ui';
import {
  ref, onMounted, onUnmounted, nextTick,
} from 'vue';
import 'swagger-ui/dist/swagger-ui.css';
import { v4 } from 'uuid';
import Service from '../../../../fronts/app/src/models/service';
import SectionCmp from '../../../../fronts/app/src/components/Section.vue';
import Theme from '../../../../fronts/app/src/helpers/Theme';
import axios from '../../../../fronts/app/src/helpers/axios';

function uuid() {
  return `a${v4().replaceAll('-', '')}`;
}
const id = ref(uuid());
const dark = ref(false);
const observable = Theme.observableCurrentTheme.subscribe(async (_, theme) => {
  dark.value = theme === 'dark';
});
onUnmounted(() => {
  observable?.unsubscribe?.();
});
const props = defineProps({
  service: {
    default: null,
    type: Service,
  },
});
onMounted(async () => {
  id.value = uuid();
  dark.value = Theme.currentTheme === 'dark';
  const { data: spec } = await axios.post('/openapi/swagger.json', { url: props.service.openapiURL });
  SwaggerUi({
    dom_id: `#${id.value}`,
    url: props.service.openapiURL,
    spec,
    explorer: false,
    deepLinking: false,
    defaultModelsExpandDepth: -1,
    displayRequestDuration: true,
    persistAuthorization: true,
    filter: true,
    syntaxHighlight: {
      theme: 'monokai',
    },
    plugins: [
    ],
    layout: 'BaseLayout',
  });
});

</script>

<style lang="scss" scoped>
::v-deep {
  .swagger-ui {
    padding: 10px 0;
    border-radius: 5px;
    .information-container {
      display: none;
    }
  }
}
.dark {
  ::v-deep {

    .swagger-ui {
    }
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

          .swagger-ui .model-box-control:focus,
          .swagger-ui .models-control:focus,
          .swagger-ui .opblock-summary-control:focus {
              outline: none;
          }

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
          .addworking-title {
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

        }
}
</style>

<style>
:root {
    --swagger-color: #59ab37;
    --link-color: #86E1F4;
    --accept-header-color: #34A05E;

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

    --all-bg-color: #282A36;
    --secondary-bg-color: #282A35;
    --header-bg-color: #3A3D4C;
    --block-bg-color: #414450;
    --selecter-bg-color: #3A3D4C;

    --primary-text-color: rgba(255, 255, 255, 1.00);
    --secondary-text-color: rgba(193, 192, 192, 1.00);

    --block-border-color: rgba(255, 255, 255, 0.08);
    --block-border-radius: 12px;
    --innner-block-border-radius: 8px;

    --primary-icon-color: #ffffff;
    --icons-opacity: 0;
    --secondary-icon-opacity: .6;
    --black-icons-filter: invert(1);
}
</style>
