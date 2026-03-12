declare module "mailparser" {
  export function simpleParser(
    source: Buffer | string | NodeJS.ReadableStream
  ): Promise<{
    html?: string | false;
    text?: string | false;
    subject?: string;
    from?: { value: { address: string; name: string }[] };
    to?: { value: { address: string; name: string }[] };
    date?: Date;
    [key: string]: unknown;
  }>;
}
