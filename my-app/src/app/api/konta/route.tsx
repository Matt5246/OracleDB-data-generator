import { NextResponse } from "next/server";
const oracledb = require('oracledb');

// Set the database connection configuration
const dbConfig = {
  user: 's102488',
  password: 'pniziolek56!',
  connectString: '217.173.198.135:1521/tpdb' // Host:Port/ServiceName or Host:Port/SID
};

export async function GET(req: Request) {
  let connection;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    // Function to get existing klient IDs
    const getExistingKlientIds = async () => {
      const query = 'SELECT id_klienta FROM Klient';
      const result = await connection.execute(query);
      return result.rows.map((row) => row[0]);
    };
    const getExistingKontaIds = async () => {
        const query = 'SELECT id_konta FROM Konta';
        const result = await connection.execute(query);
        return result.rows.map((row) => row[0]);
      };
    // Function to get existing historia_zamowien IDs
    const getExistingHistoriaZamowienIds = async () => {
      const query = 'SELECT id_historia_z FROM Historia_zamowien';
      const result = await connection.execute(query);
      return result.rows.map((row) => row[0]);
    };

    // Define the insert function to insert random konta data
    const insertRandomKonta = async (howMany, connection) => {
      const existingKlientIds = await getExistingKlientIds();
      const existingHistoriaZamowienIds = await getExistingHistoriaZamowienIds();
      const existingIds = await getExistingKontaIds(); // Start ID for new rows
      const startingId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1; 
      const insertSql = `INSERT INTO konta (id_konta, haslo, email, klient_id_klienta, historia_zamowien_id_hz) 
        VALUES (:1, :2, :3, :4, :5)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
          const id_konta = startingId + i;
          const haslo = generateRandomPassword();
          const email = generateRandomEmail();
          const klient_id_klienta = existingKlientIds[Math.floor(Math.random() * existingKlientIds.length)];
          const historia_zamowien_id_hz = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)];

          insertPromises.push(
            connection.execute(insertSql, [id_konta, haslo, email, klient_id_klienta, historia_zamowien_id_hz])
          );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted into konta successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into konta:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomKonta(100, connection);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Database connection closed.');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }

  // Return a response
  return NextResponse.json({ message: 'Data generation completed.' });
}
// Helper function to generate a random password (you can replace this with your implementation)
function generateRandomPassword() {
    return Math.random().toString(36).substring(2, 10);
  }
  
  // Helper function to generate a random email (you can replace this with your implementation)
  function generateRandomEmail() {
    const domains = ['gmail.com', 'interia.com', 'wp.pl', 'yahoo.com', 'outlook.com', 'aol.com', 'protonmail.com'];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    return `user${Math.floor(Math.random() * 1000)}@${randomDomain}`;
  }