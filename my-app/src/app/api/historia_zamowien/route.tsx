import { NextResponse } from "next/server";
const oracledb = require('oracledb');

// Set the database connection configuration
const dbConfig = {
  user: 's102488',
  password: 'pniziolek56!',
  connectString: '217.173.198.135:1521/tpdb' // Host:Port/ServiceName or Host:Port/SID
};

export async function GET(req: Request) {
  let connection:any;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    // Define the function to generate random dates within a range
    const getRandomDate = (start:Date, end:Date) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
      return new Date(randomTime);
    };
    const getExistingHistoriaZamowienIds = async () => {
        const query = 'SELECT id_historia_z FROM Historia_zamowien';
        const result = await connection.execute(query);
        return result.rows.map((row:any) => row[0]);
      };
    // Define the insert function to insert random historia_zamowien data
    const insertRandomHistoriaZamowien = async (howMany:any, connection:any) => {
      const insertSql = `INSERT INTO historia_zamowien (id_historia_z, historia_zamowien) VALUES (:1, :2)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
            const existingIds = await getExistingHistoriaZamowienIds(); // Start ID for new rows
            const startingId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            const historia_zamowien = getRandomDate(new Date('2000-01-01'), new Date('2023-12-31')); // Generate random date within range

            insertPromises.push(
                connection.execute(insertSql, [startingId, historia_zamowien])
            );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted into historia_zamowien successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into historia_zamowien:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomHistoriaZamowien(10, connection);
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
  return NextResponse.json({ message: 'Data generation completed for historia_zamowien.' });
}
