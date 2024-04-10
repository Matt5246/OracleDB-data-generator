import { NextResponse } from "next/server";
const oracledb = require('oracledb');

// Set the database connection configuration
const dbConfig = {
  user: 's102488',
  password: 'pniziolek56!',
  connectString: '217.173.198.135:1521/tpdb' // Host:Port/ServiceName or Host:Port/SID
};

// Helper function to generate random dates within a range
const getRandomDate = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(randomTime);
};

// Helper function to get existing historia_zamowien IDs
const getExistingHistoriaZamowienIds = async (connection) => {
  const query = 'SELECT id_historia_z FROM Historia_zamowien';
  const result = await connection.execute(query);
  return result.rows.map((row) => row[0]);
};

// Helper function to generate a random number between min and max (inclusive)
const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json(new Error('Method Not Allowed'), { status: 405 });
  }

  const { numberOfRows } = await req.json();
  let connection;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    // Define the insert function to insert random historia_zamowien data
    const insertRandomHistoriaZamowien = async (howMany, connection) => {
      const existingIds = await getExistingHistoriaZamowienIds(connection); // Get existing historia_zamowien IDs
      const startingId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const insertSql = `INSERT INTO Historia_zamowien (id_historia_z, historia_zamowien) VALUES (:1, :2)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
          const id_historia_z = startingId + i;
          const historia_zamowien = getRandomDate(new Date('2000-01-01'), new Date('2023-12-31')); // Generate random date within range

          insertPromises.push(
            connection.execute(insertSql, [id_historia_z, historia_zamowien])
          );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted into Historia_zamowien successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into Historia_zamowien:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomHistoriaZamowien(numberOfRows || 10, connection);
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
  return NextResponse.json({ message: `Data generation completed for Historia_zamowien. Inserted ${numberOfRows || 10} rows.` });
}
