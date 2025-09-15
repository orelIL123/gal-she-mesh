import { MessageProvider, SendMessageParams, SendMessageResult } from '../types';

export class SMS4FreeProvider implements MessageProvider {
  name = 'sms4free';
  private apiKey: string;
  private user: string;
  private pass: string;
  private sender: string;
  private enabled: boolean;
  private endpoint = 'https://api.sms4free.co.il/ApiSMS/v2/SendSMS';

  constructor(cfg: { apiKey: string; user: string; pass: string; sender: string; enabled: boolean }) {
    this.apiKey = cfg.apiKey || 'mgfwkoRBI';
    this.user = cfg.user || '0523985505';
    this.pass = cfg.pass || '73960779';
    this.sender = cfg.sender || 'ToriX';
    this.enabled = cfg.enabled;
  }

  isAvailable(): boolean {
    return this.enabled && !!this.apiKey && !!this.user && !!this.pass && !!this.sender;
  }

  async send(params: SendMessageParams): Promise<SendMessageResult> {
    if (!this.isAvailable()) {
      return { success: false, error: 'SMS4FREE not available', provider: this.name };
    }

    try {
      let recipient = params.to;
      if (recipient.startsWith('+972')) {
        recipient = '0' + recipient.substring(4);
      }

      const message = params.message.length > 70 ? params.message.substring(0, 67) + '...' : params.message;

      const body = {
        key: this.apiKey,
        user: this.user,
        pass: this.pass,
        sender: this.sender,
        recipient,
        msg: message,
      } as const;

      const resp = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const out = await resp.json();

      if (typeof out?.status === 'number' && out.status > 0) {
        return { success: true, messageId: String(out.status), provider: this.name };
      }
      return { success: false, error: `${out?.status} - ${out?.message || 'unknown'}`, provider: this.name };
    } catch (e: any) {
      return { success: false, error: e?.message || 'unknown', provider: this.name };
    }
  }
}

