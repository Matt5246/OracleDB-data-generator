import { NextResponse } from "next/server";
const oracledb = require('oracledb');

// Set the database connection configuration
const dbConfig = {
  user: 's102488',
  password: 'pniziolek56!',
  connectString: '217.173.198.135:1521/tpdb' // Host:Port/ServiceName or Host:Port/SID
};

// Helper function to generate a random number between min and max (inclusive)
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET(req: Request) {
  let connection;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    // Function to get existing IDs from different tables
    const getExistingIds = async (tableName, idColumnName) => {
      const query = `SELECT ${idColumnName} FROM ${tableName}`;
      const result = await connection.execute(query);
      return result.rows.map((row) => row[0]);
    };

    // Define the insert function to insert random data into the platnosci table
    const insertRandomPlatnosciData = async (howMany, connection) => {
      const existingZamowieniaIds = await getExistingIds('zamówienia', 'id_zamowienia');
      const existingKontaIds = await getExistingIds('konta', 'id_konta');
      const existingHistoriaZamowienIds = await getExistingIds('historia_zamowien', 'id_historia_z');
      const existingPlatnosciIds = await getExistingIds('platnosci', 'id_platnosci'); // Get existing platnosci IDs

      const insertSql = `INSERT INTO platnosci (id_platnosci, suma, "Data-platnosci", rodzaj_platnosci, czy_oplacone, zamówienia_id_zamowienia, zamówienia_konta_id_konta, zamówienia_konta_id_historia_z) 
        VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
          const id_platnosci = existingPlatnosciIds.length > 0 ? Math.max(...existingPlatnosciIds) + i + 1 : i + 1; // Generate new ID
          const suma = generateRandomNumber(10, 1000); // Random suma value
          const data_platnosci = new Date(); // Current date
          const rodzaj_platnosci = Math.random() < 0.5 ? 'Online' : 'Offline'; // Random rodzaj_platnosci value
          const czy_oplacone = Math.random() < 0.8 ? 1 : 0; // Random czy_oplacone value (80% chance of being 1)
          const zamówienia_id_zamowienia = existingZamowieniaIds[Math.floor(Math.random() * existingZamowieniaIds.length)];
          const zamówienia_konta_id_konta = existingKontaIds[Math.floor(Math.random() * existingKontaIds.length)];
          const zamówienia_konta_id_historia_z = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)];

          insertPromises.push(
            connection.execute(insertSql, [id_platnosci, suma, data_platnosci, rodzaj_platnosci, czy_oplacone, zamówienia_id_zamowienia, zamówienia_konta_id_konta, zamówienia_konta_id_historia_z])
          );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted into platnosci successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into platnosci:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomPlatnosciData(10, connection);
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
