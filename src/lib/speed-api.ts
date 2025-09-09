import axios from 'axios';

interface ZapResult {
  success: boolean;
  simulated?: boolean;
  transactionId?: string;
  amount: number;
  recipient: string;
  description?: string;
  fee?: number;
  error?: string;
}

interface BalanceResult {
  balance: number;
  simulated?: boolean;
  error?: string;
}

class SpeedAPI {
  private apiKey: string;
  private apiUrl: string;
  private isSimulated: boolean;

  constructor() {
    this.apiKey = process.env.SPEED_API_KEY || '';
    this.apiUrl = process.env.SPEED_API_URL || 'https://api.speed.app';
    this.isSimulated = !this.apiKey || process.env.NODE_ENV === 'development';
    
    if (this.isSimulated) {
      console.log('🚨 Speed API running in SIMULATION mode');
    }
  }

  getStatus() {
    return {
      simulated: this.isSimulated,
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey
    };
  }

  async sendZap(recipientAddress: string, amount: number, description: string): Promise<ZapResult> {
    if (this.isSimulated) {
      console.log(`🎭 SIMULATED ZAP: ${amount} sats to ${recipientAddress} - ${description}`);
      return {
        success: true,
        simulated: true,
        amount,
        recipient: recipientAddress,
        description
      };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/v1/payments/send`, {
        recipient: recipientAddress,
        amount,
        description
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

    } catch (error: unknown) {
      console.error('Speed API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        amount,
        recipient: recipientAddress
      };
    }
  }

  async getBalance(): Promise<BalanceResult> {
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

    } catch (error: unknown) {
      console.error('Speed API Balance Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        balance: 0,
        error: errorMessage
      };
    }
  }
}

export default SpeedAPI;
