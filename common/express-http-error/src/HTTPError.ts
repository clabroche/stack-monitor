import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';

export const statusMessage = {
  403: 'Not allowed',
  404: 'Resource not found',
  500: 'We cannot respond to your request for moment. Contact support for more information',
};

class HTTPError extends Error {
  public message: string;

  public code: number;

  public errorId: string;

  public date: string;

  public originalMessage: string;

  public originalStack?: string;

  public details?: string;

  constructor(
    message: string,
    code?: number,
    errorId = uuid(),
    date = dayjs().format('YYYY-MM-DD HH:mm:ss'),
    stack = '',
  ) {
    super(message);
    this.code = code || 500;
    this.errorId = errorId;
    this.date = date;
    this.message = process.env.NODE_ENV === 'production'
      ? statusMessage[this.code] || message?.toString() || message
      : message?.toString() || message || statusMessage[this.code];
    this.originalMessage = message;
    this.originalStack = stack || new Error().stack;
  }
}

export default HTTPError;
