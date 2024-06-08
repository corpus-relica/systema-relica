import Pool from "pg-pool";
import dotenv from "dotenv";
dotenv.config();

// Connection URL
const url = process.env.RELICA_CLARITY_CORE_MONGO_URI; //mongodb://localhost:27017";
const dbName = "CCDB";
// const collectionName = db.collection("environment");

const HOST = process.env.RELICA_POSTGRES_HOST;
const PORT: number = process.env.RELICA_POSTGRES_PORT
  ? parseInt(process.env.RELICA_POSTGRES_PORT)
  : 5432;
const DB_NAME = process.env.RELICA_POSTGRES_DB_NAME;
const USER = process.env.RELICA_POSTGRES_USER;
const PASSWORD = process.env.RELICA_POSTGRES_PASSWORD;

class PGClient {
  pool: any;

  constructor() {}

  async connect() {
    console.log("Connecting to PostgreSQL...");

    console.log("host", HOST);
    console.log("port", PORT);
    console.log("database", DB_NAME);
    console.log("user", USER);
    console.log("password", PASSWORD);

    this.pool = new Pool({
      host: HOST,
      port: PORT,
      database: DB_NAME,
      user: USER,
      password: PASSWORD,
    });
    console.log("Connected to PostgreSQL!");
  }

  async query(q: string, data?: any) {
    if (data) {
      return await this.pool.query(q, data);
    } else {
      return await this.pool.query(q);
    }
  }
}

const pgClient = new PGClient();
export default pgClient;
