const { ObjectId } = require('mongodb');
const { MongoClient } = require('mongodb');

class MongoDB {
  /**
   * Generate a new ObjectId
   * @returns {ObjectId} A new MongoDB ObjectId
   */
  generateObjectId() {
    return new ObjectId();
  }

  /**
   * Check if a string is a valid MongoDB ObjectId
   * @param {string} id - The string to check
   * @returns {boolean} True if valid, false otherwise
   */
  isValidObjectId(id) {
    if (!id) return false;
    try {
      new ObjectId(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decode an ObjectId to get its components
   * @param {string} objectId - The ObjectId to decode
   * @returns {Object} The decoded information
   */
  decodeObjectId(objectId) {
    if (!this.isValidObjectId(objectId)) {
      return { 
        isValid: false,
        error: 'Invalid ObjectId format'
      };
    }

    try {
      const timestamp = parseInt(objectId.substring(0, 8), 16);
      const date = new Date(timestamp * 1000);
      
      // Convert to Buffer for correct binary and base64 conversions
      const buffer = Buffer.from(objectId, 'hex');
      
      return {
        isValid: true,
        timestamp,
        date,
        machineId: objectId.substring(8, 14),
        processId: objectId.substring(14, 18),
        counter: objectId.substring(18, 24),
        format: {
          hex: objectId,
          binary: buffer.toString('binary'),
          base64: buffer.toString('base64')
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { 
        isValid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Create an ObjectId from a timestamp
   * @param {Date|string} date - The date to use
   * @returns {string} The generated ObjectId
   */
  objectIdFromDate(date) {
    const timestamp = Math.floor(new Date(date).getTime() / 1000);
    return `${timestamp.toString(16)}0000000000000000`;
  }

  /**
   * Compare two ObjectIds
   * @param {string} objectId1 - First ObjectId
   * @param {string} objectId2 - Second ObjectId
   * @returns {Object} Comparison results
   */
  compareObjectIds(objectId1, objectId2) {
    const obj1 = this.decodeObjectId(objectId1);
    const obj2 = this.decodeObjectId(objectId2);
    
    if (!obj1.isValid || !obj2.isValid) {
      return {
        isValid: false,
        error: 'One or both ObjectIds are invalid'
      };
    }

    const timeDifference = obj1.timestamp - obj2.timestamp;
    const millisecondsDiff = timeDifference * 1000;
    
    return {
      isValid: true,
      timeDifference: {
        seconds: timeDifference,
        milliseconds: millisecondsDiff,
        humanReadable: this.formatTimeDifference(millisecondsDiff)
      },
      sameServer: obj1.machineId === obj2.machineId,
      sameProcess: obj1.processId === obj2.processId,
      counterDifference: parseInt(obj1.counter, 16) - parseInt(obj2.counter, 16)
    };
  }

  /**
   * Format time difference in a human readable format
   * @param {number} milliseconds - Time difference in milliseconds
   * @returns {string} Formatted time difference
   */
  formatTimeDifference(milliseconds) {
    const absMs = Math.abs(milliseconds);
    const prefix = milliseconds >= 0 ? 'newer by ' : 'older by ';
    
    if (absMs < 1000) return `${prefix}${absMs} milliseconds`;
    if (absMs < 60000) return `${prefix}${Math.floor(absMs/1000)} seconds`;
    if (absMs < 3600000) return `${prefix}${Math.floor(absMs/60000)} minutes`;
    if (absMs < 86400000) return `${prefix}${Math.floor(absMs/3600000)} hours`;
    return `${prefix}${Math.floor(absMs/86400000)} days`;
  }

  /**
   * Test MongoDB connection
   * @param {string} connectionString - MongoDB connection string
   * @returns {Promise<Object>} Connection test results
   */
  async testConnection(connectionString) {
    let client;
    try {
      client = new MongoClient(connectionString, { 
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      await client.connect();
      
      // Get server information
      const admin = client.db().admin();
      const serverInfo = await admin.serverInfo();
      
      // Get database list
      const dbList = await client.db().admin().listDatabases();
      
      return {
        success: true,
        version: serverInfo.version,
        databases: dbList.databases.map(db => ({
          name: db.name,
          sizeOnDisk: db.sizeOnDisk,
          empty: db.empty
        }))
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      if (client) await client.close();
    }
  }
}

module.exports = new MongoDB(); 