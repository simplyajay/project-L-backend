import dotenv from "dotenv";

class EnvConfigService {
  constructor() {
    this.loadEnvironment();
  }

  loadEnvironment(): void {
    const envFile = ".env";
    dotenv.config({ path: envFile });
  }

  get(key: string): string | undefined {
    return process.env[key];
  }
}

const env = new EnvConfigService();
export default env;
