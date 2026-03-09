import snowflake from 'snowflake-sdk';
import 'dotenv/config';

snowflake.configure({ logLevel: 'WARN' });

const connection = snowflake.createConnection({
  account:   process.env.SF_ACCOUNT!,
  username:  process.env.SF_USER!,
  password:  process.env.SF_PASSWORD!,
  role:      process.env.SF_ROLE!,
  warehouse: process.env.SF_WAREHOUSE!,
  database:  process.env.SF_DATABASE!,
  schema:    'VIEWS',
});

export function connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function query<T = Record<string, unknown>>(
  sql: string,
  binds: unknown[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      binds: binds as snowflake.Binds,
      complete: (err, _stmt, rows) => {
        if (err) reject(err);
        else resolve((rows ?? []) as T[]);
      },
    });
  });
}
