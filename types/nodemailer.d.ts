declare module 'nodemailer' {
  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth: {
      user: string;
      pass: string;
    };
    // Add missing properties used in our code
    connectionTimeout?: number;
    socketTimeout?: number;
    tls?: {
      rejectUnauthorized?: boolean;
      [key: string]: any;
    };
    debug?: boolean;
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
    // Add the verify method used in our code
    verify(): Promise<boolean>;
  }

  function createTransport(options: TransportOptions): Transporter;

  export default {
    createTransport
  };
}
