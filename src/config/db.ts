import mongoose from "mongoose";
import env from "./env.js";

class DatabaseConfig {
  url: string;
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  retryDelay: number;
  currentRetries: number;
  maxRetries: number;

  constructor() {
    this.url = env.get("MONGODB_URI") ?? "";
    this.connected = false;
    this.connecting = false;
    this.reconnecting = false;
    this.retryDelay = 2000;
    this.currentRetries = 0;
    this.maxRetries = 3;
    this._setupEventListeners();
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) return;
    this.connecting = true;
    try {
      console.log('Connecting...')
      await mongoose.connect(this.url);
      this.currentRetries = 0; // reset on successful connection

    } catch (error) {
      if (error instanceof Error) {
        console.error("MongoDb error: Initilization failed: ", error.message);
      }

      console.error("MongoDb error: Initilization failed: ", error);

      this.connecting = false;
      this.connected = false;
      await this.reconnect();
    }
  }

  async reconnect(): Promise<void> {
    if (this.reconnecting) return;

    this.reconnecting = true;

    if (this.currentRetries >= this.maxRetries) {
      console.error("MongoDb error: Maximum number of retries reached");
      process.exit(1);
    }

    this.currentRetries++;

    await new Promise((resolve) => setTimeout(resolve, this.retryDelay)); // delay the retry
    await this.connect();

    this.reconnecting = false;
  }

  isConnected() {
    return this.connected;
  }

  _setupEventListeners(): void {
    mongoose.connection.on("connected", () => {
      console.log("MongoDb Connected Successfully");
      this.connected = true;
      this.connecting = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected! Trying to reconnect...");
      this.connected = false;
      this.connecting = false;
      this.reconnect();
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected!");
      this.connected = true;
      this.connecting = false;
    });

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB error:", error);
      this.connected = false;
      this.connecting = false;
      this.reconnect();
    });
  }
}

const dbConfig = new DatabaseConfig();
export default dbConfig;
