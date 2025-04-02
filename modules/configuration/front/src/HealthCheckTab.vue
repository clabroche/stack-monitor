<template>
  <div class="configuration-container">
    <div class="section">
      <div class="section-header">
        <i class="fas fa-heartbeat mr-2"></i>
        <span>Health Check Configuration</span>
        <i v-tooltip="'Configure how the service health is monitored'" class="fas fa-question-circle ml-2 hint-icon"></i>
      </div>
      <div class="section-content">
        <div class="health-check-config">
          <div class="health-field health-toggle">
            <ToggleSwitch v-model="service.health.enabled" @change="save" />
            <span class="health-label">Enable Health Check</span>
          </div>
          
          <div class="health-grid">
            <div class="health-field">
              <label class="health-label">URL</label>
              <InputText 
                v-model="service.health.url" 
                placeholder="Health check URL (defaults to service URL if empty)"
                @blur="save"
                :disabled="!service.health.enabled"
              />
              <div class="hint-text" v-if="!service.health.url && service.url">
                <i class="fas fa-info-circle"></i>
                <span>Using service URL: {{ service.url }}</span>
              </div>
            </div>
            
            <div class="health-field">
              <label class="health-label">HTTP Method</label>
              <Select 
                v-model="service.health.method" 
                :options="httpMethods"
                @change="save"
                :disabled="!service.health.enabled"
              />
            </div>
            
            <div class="health-field">
              <label class="health-label">Expected Status Code</label>
              <InputNumber 
                :defaultValue="service.health.returnCode" 
                @input="($event) => service.health.returnCode = $event.value"
                :min="100" 
                :max="599"
                @blur="save"
                :disabled="!service.health.enabled"
              />
            </div>
            
            <div class="health-field">
              <label class="health-label">Interval (ms)</label>
              <InputNumber 
                :defaultValue="service.health.interval" 
                @input="($event) => service.health.interval = $event.value"
                :min="100"
                placeholder="Check interval in milliseconds"
                @blur="save"
                :disabled="!service.health.enabled"
              />
            </div>
            
            <div class="health-field">
              <label class="health-label">Timeout (ms)</label>
              <InputNumber 
                :defaultValue="service.health.timeout" 
                @input="($event) => service.health.timeout = $event.value"
                :min="0"
                placeholder="Request timeout in milliseconds"
                @blur="save"
                :disabled="!service.health.enabled"
              />
            </div>
            
            <div class="health-field">
              <label class="health-label">Start After (ms)</label>
              <InputNumber 
                :defaultValue="service.health.startAfter" 
                @input="($event) => service.health.startAfter = $event.value"
                :min="0"
                placeholder="Delay before first health check"
                @blur="save"
                :disabled="!service.health.enabled"
              />
              <div class="hint-text">
                <i class="fas fa-info-circle"></i>
                <span>Delay before starting health checks after service launch</span>
              </div>
            </div>
          </div>
          
          <div class="health-field full-width">
            <label class="health-label">Expected Response Text (optional)</label>
            <Textarea 
              v-model="service.health.responseText" 
              placeholder="Enter expected response text (leave empty to ignore response content)"
              @blur="save"
              rows="4"
              :disabled="!service.health.enabled"
            />
            <div class="hint-text">
              <i class="fas fa-info-circle"></i>
              <span>If specified, the response must match this text exactly for the health check to pass</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';

export default {
  components: {
    InputText,
    InputNumber,
    Textarea,
    Select,
    ToggleSwitch
  },
  props: {
    service: {
      type: Object,
      required: true
    },
    expandedKeys: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const httpMethods = ref(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

    // Make sure health object exists
    if (!props.service.health) {
      props.service.health = {
        enabled: false,
        url: '',
        interval: 1000,
        method: 'GET',
        returnCode: 200,
        responseText: '',
        timeout: 5000,
        startAfter: 0
      };
    }

    const save = () => {
      console.log(props.service.health.startAfter)
      props.service.save()
        .catch(error => {
          console.error('Error saving health check configuration:', error);
        });
    };

    return {
      httpMethods,
      save
    };
  }
};
</script>

<style lang="scss" scoped>
.configuration-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0.75rem;
}

.section {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background-color: var(--system-sections-backgroundColor);
  border-radius: 6px;
  border: 1px solid var(--system-border-borderColor);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
}

.section-content {
  margin-top: 0.25rem;
}

.hint-icon {
  font-size: 11px;
  margin-left: 5px;
  color: var(--system-text-tertiaryLabel);
  cursor: help;
  
  &:hover {
    color: var(--system-text-secondaryLabel);
  }
}

.health-check-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.health-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  
  &.health-toggle {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
  
  &.full-width {
    grid-column: 1 / -1;
  }
}

.health-label {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--system-text-secondaryLabel);
}

.hint-text {
  font-size: 0.75rem;
  color: var(--system-text-tertiaryLabel);
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style> 