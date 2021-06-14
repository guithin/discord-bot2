declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_HOST: string;
      DB_PORT: string;
      DB_SCHEME_NAME: string;
      DB_PASSWD: string;
      TOKEN: string;
      DB_USERNAME: string;
      [key: string]: string;
    }
  }
}

export {};
