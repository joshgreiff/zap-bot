const axios = require('axios');

class SpeedAPI {
  constructor() {
    this.apiKey = process.env.SPEED_API_KEY;
    this.apiUrl = process.env.SPEED_API_URL || 'https://api.tryspeed.com';
    this.isSimulated = !this.apiKey; // If no API key, run in simulation mode
  }

  async sendZap(recipientAddress, amount, description = '') {
    if (this.isSimulated) {
      // Simulate the zap for testing
      console.log(`[SIMULATED] Sending ${amount} sats to ${recipientAddress}`);
      return {
        success: true,
        simulated: true,
        transactionId: `sim_${Date.now()}`,
        amount,
        recipient: recipientAddress,
        description
      };
    }

    try {
      // TODO: Replace with actual Speed API endpoint when we get documentation
      const response = await axios.post(`${this.apiUrl}/v1/payments`, {
        recipient: recipientAddress,
        amount: amount,
        description: description,
        currency: 'sats'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        simulated: false,
        transactionId: response.data.id,
        amount,
        recipient: recipientAddress,
        description,
        fee: response.data.fee || 0
      };

    } catch (error) {
      console.error('Speed API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        amount,
        recipient: recipientAddress
      };
    }
  }

  async getBalance() {
    if (this.isSimulated) {
      return {
        balance: 1000000, // 1M sats for testing
        simulated: true
      };
    }

    try {
      // TODO: Replace with actual Speed API endpoint
      const response = await axios.get(`${this.apiUrl}/v1/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return {
        balance: response.data.balance,
        simulated: false
      };

    } catch (error) {
      console.error('Speed API Balance Error:', error.response?.data || error.message);
      return {
        balance: 0,
        error: error.response?.data?.message || error.message
      };
    }
  }

  isSimulationMode() {
    return this.isSimulated;
  }

  getStatus() {
    return {
      isSimulated: this.isSimulated,
      hasApiKey: !!this.apiKey,
      apiUrl: this.apiUrl
    };
  }
}

module.exports = SpeedAPI; 