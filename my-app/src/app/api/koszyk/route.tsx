import { NextResponse } from "next/server";
import { oracledb, dbConfig } from "@/lib/oracle";
import fs from 'fs';

// Helper function to generate a random number between min and max (inclusive)
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json(new Error('Method Not Allowed'), { status: 405 });
  }

  const { numberOfRows } = await req.json();
  let connection: any;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    const getExistingIds = async (tableName, idColumnName) => {
      const query = `SELECT ${idColumnName} FROM ${tableName}`;
      const result = await connection.execute(query);
      return result.rows.map((row) => row[0]);
    };

    // Define the insert function to insert random data into the koszyk table
    const insertRandomKoszykData = async (howMany, connection) => {
      const existingZamowieniaIds = await getExistingIds('zamówienia', 'id_zamowienia');
      const existingKontaIds = await getExistingIds('konta', 'id_konta');
      const existingHistoriaZamowienIds = await getExistingIds('historia_zamowien', 'id_historia_z');
      const existingKoszykIds = await getExistingIds('koszyk', 'id_koszyk'); // Get existing koszyk IDs

      const insertSql = `INSERT INTO koszyk (id_koszyk, zamówienia_id_zamowienia, zamówienia_konta_id_konta, zamówienia_konta_id_historia_z) 
                VALUES (:1, :2, :3, :4)`;

      try {
        const insertPromises = [];
        const sqlStatements = [];

        for (let i = 0; i < howMany; i++) {
          const id_koszyk = existingKoszykIds.length > 0 ? Math.max(...existingKoszykIds) + i + 1 : i + 1; // Generate new ID
          const zamówienia_id_zamowienia = existingZamowieniaIds[Math.floor(Math.random() * existingZamowieniaIds.length)];
          const zamówienia_konta_id_konta = existingKontaIds[Math.floor(Math.random() * existingKontaIds.length)];
          const zamówienia_konta_id_historia_z = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)];

          insertPromises.push(
            connection.execute(insertSql, [id_koszyk, zamówienia_id_zamowienia, zamówienia_konta_id_konta, zamówienia_konta_id_historia_z])
          );

          // Push SQL statement into the array
          sqlStatements.push(`INSERT INTO koszyk VALUES (${id_koszyk}, ${zamówienia_id_zamowienia}, ${zamówienia_konta_id_konta}, ${zamówienia_konta_id_historia_z});`);
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        fs.appendFileSync('src/app/inserts.sql', sqlStatements.join('\n') + '\n');
        console.log('SQL statements written to inserts.txt');

        console.log(`${howMany} records inserted into koszyk successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into koszyk:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomKoszykData(numberOfRows || 10, connection);
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
  return NextResponse.json({ message: `Data generation completed. inserted ${numberOfRows || 10} rows` });
}
