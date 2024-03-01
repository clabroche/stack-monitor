<template>
  <section-cmp :key="service?.label">
    <div :id="id" :class="{dark}"></div>
  </section-cmp>
</template>

<script setup>
import SwaggerUi from 'swagger-ui';
import {
  ref, onMounted, onUnmounted,
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
</style>

<style lang="scss">
.swagger-ui .scheme-container {
    background-color: transparent;
    box-shadow: none;
}

.swagger-ui .dialog-ux .modal-ux {
    background: var(--system-sections-backgroundColor);
}
.swagger-ui .dialog-ux .modal-ux,
.swagger-ui .dialog-ux .modal-ux button,
.swagger-ui label,
.swagger-ui .tab li,
.swagger-ui .model,
.swagger-ui .dialog-ux .modal-ux-content p,
.swagger-ui .dialog-ux .modal-ux-header h3,
.swagger-ui .dialog-ux .modal-ux-content h4 {
    color: var(--system-color);
}
.swagger-ui select,
.swagger-ui input[type=email], .swagger-ui input[type=file], .swagger-ui input[type=password], .swagger-ui input[type=search], .swagger-ui input[type=text], .swagger-ui textarea,
.swagger-ui .filter .operation-filter-input {
    background: var(--system-background);
    color: var(--system-color);
    border-color: var(--system-sections-innerShadow);
    &::placeholder {
        color: var(--system-color);

    }
}
.swagger-ui .dialog-ux .modal-ux,
.swagger-ui .auth-container,
.swagger-ui .dialog-ux .modal-ux-header {
    border-color: var(--system-sections-innerShadow-lighter);
}

.swagger-ui .dialog-ux .modal-ux button {
    box-shadow: none;
}

.swagger-ui,
.swagger-ui .btn,
.swagger-ui .response-col_links,
.swagger-ui .response-col_status,
.swagger-ui .parameter__name,
.swagger-ui .parameter__type,
.swagger-ui section h3,
.swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5,
.swagger-ui .opblock .opblock-section-header h4,
.swagger-ui table thead tr td, .swagger-ui table thead tr th,
.swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p,
.swagger-ui .opblock-description-wrapper, .swagger-ui .opblock-external-docs-wrapper, .swagger-ui .opblock-title_normal, 
.swagger-ui .opblock .opblock-summary-description, .swagger-ui .opblock-tag, .swagger-ui .opblock .opblock-summary-operation-id, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated {
    color: var(--system-color)
}
.swagger-ui .opblock .opblock-summary .view-line-link.copy-to-clipboard {
    display: none;
}
.swagger-ui .model-box-control:focus, .swagger-ui .models-control:focus, .swagger-ui .opblock-summary-control:focus {
    outline: none;
}
.swagger-ui button {
    box-shadow: none;
    outline: none;
}
.swagger-ui .opblock .opblock-section-header {
    background: var(--system-sections-backgroundColor);
    color: var(--system-sections-color);
}
</style>
