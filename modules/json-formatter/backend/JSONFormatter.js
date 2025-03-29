const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const xmljs = require('xml-js');
const Ajv = require('ajv').default;

class JSONFormatter {
  /**
   * Validate JSON against a schema
   * @param {Object} json - The JSON object to validate
   * @param {Object} schema - The JSON schema
   * @returns {Object} Validation result
   */
  validateSchema(json, schema) {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(json);
    return {
      valid,
      errors: validate.errors || []
    };
  }

  /**
   * Convert JSON to YAML
   * @param {Object} json - The JSON object to convert
   * @returns {string} YAML string
   */
  jsonToYaml(json) {
    return yaml.dump(json);
  }

  /**
   * Convert YAML to JSON
   * @param {string} yamlStr - The YAML string to convert
   * @returns {Object} JSON object
   */
  yamlToJson(yamlStr) {
    return yaml.load(yamlStr);
  }

  /**
   * Convert JSON to XML
   * @param {Object} json - The JSON object to convert
   * @returns {string} XML string
   */
  jsonToXml(json) {
    return xmljs.js2xml(json, { compact: true, spaces: 2 });
  }

  /**
   * Convert XML to JSON
   * @param {string} xmlStr - The XML string to convert
   * @returns {Object} JSON object
   */
  xmlToJson(xmlStr) {
    return xmljs.xml2js(xmlStr, { compact: true });
  }

  /**
   * Compress JSON (remove whitespace)
   * @param {Object|string} json - The JSON object or string to compress
   * @returns {string} Compressed JSON string
   */
  compressJson(json) {
    const jsonObj = typeof json === 'string' ? JSON.parse(json) : json;
    return JSON.stringify(jsonObj);
  }

  /**
   * Pretty print JSON (add indentation)
   * @param {Object|string} json - The JSON object or string to format
   * @param {number} indentation - Number of spaces for indentation
   * @returns {string} Formatted JSON string
   */
  prettyPrintJson(json, indentation = 2) {
    const jsonObj = typeof json === 'string' ? JSON.parse(json) : json;
    return JSON.stringify(jsonObj, null, indentation);
  }

  /**
   * Calculate statistics about a JSON object
   * @param {Object} json - The JSON object
   * @returns {Object} Statistics object
   */
  getJsonStats(json) {
    const stats = {
      size: 0,
      stringifiedSize: 0,
      depth: 0,
      keys: 0,
      arrays: 0,
      objects: 0,
      primitives: 0
    };
    
    // Calculate size in bytes
    stats.stringifiedSize = JSON.stringify(json).length;
    stats.size = Buffer.from(JSON.stringify(json)).length;
    
    // Calculate other stats
    const traverse = (obj, depth = 0) => {
      if (depth > stats.depth) stats.depth = depth;
      
      if (Array.isArray(obj)) {
        stats.arrays++;
        for (const item of obj) {
          if (typeof item === 'object' && item !== null) {
            traverse(item, depth + 1);
          } else {
            stats.primitives++;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        stats.objects++;
        const objKeys = Object.keys(obj);
        stats.keys += objKeys.length;
        
        for (const key of objKeys) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            traverse(obj[key], depth + 1);
          } else {
            stats.primitives++;
          }
        }
      }
    };
    
    traverse(json);
    return stats;
  }

  /**
   * Query JSON using JSONPath
   * @param {Object} json - The JSON object
   * @param {string} query - JSONPath query
   * @returns {Array} Query results
   */
  queryJson(json, query) {
    // Simple implementation of JSON path query
    // In a real implementation, use a library like jsonpath
    if (query === '$') return json;
    
    // This is a placeholder - in real implementation, use proper jsonpath library
    return [{ message: 'JSONPath implementation would return results here' }];
  }
}

module.exports = new JSONFormatter(); 