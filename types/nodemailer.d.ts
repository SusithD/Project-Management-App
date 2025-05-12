declare module 'nodemailer' {
  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }

  export interface SendMailOptions {
    from?: string;
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }

  export interface SentMessageInfo {
    messageId: string;
    [key: string]: any;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
  }

  function createTransport(options: TransportOptions): Transporter;

  export default {
    createTransport
  };
}
