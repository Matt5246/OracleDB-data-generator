import { NextResponse } from "next/server";
import { oracledb, dbConfig } from "@/lib/oracle";
import fs from 'fs';

// Array of example addresses
const addresses = [
  "123 Main Street",
  "456 Elm Street",
  "789 Oak Street",
  "321 Maple Avenue",
  "654 Pine Street",
  "Prószkowska 12",
  "Niemodlińska 8",
  "Kościuszki 3",
  "Ozimska 18",
  "Krasickiego 5",
  "Słowackiego 7",
  "Krakowska 4",
  "Wrocławska 1",
  "Opolska 9",
  "Kopernika 6",
  "Kościelna 2",
  "Sienkiewicza 10",
  "Piastowska 11",
  "Sikorskiego 13",
  "Katowicka 15",
];

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

    // Define the insert function to insert random data into the magazyn table
    const insertRandomMagazynData = async (howMany, connection) => {
      const existingMagazynIds = await getExistingIds('magazyn', 'id_magazyn');

      const insertSql = `INSERT INTO magazyn (id_magazyn, adres, dostepnosc) 
                    VALUES (:1, :2, :3)`;

      try {
        const insertPromises = [];
        const sqlStatements = [];

        for (let i = 0; i < howMany; i++) {
          const id_magazyn = existingMagazynIds.length > 0 ? Math.max(...existingMagazynIds) + i + 1 : i + 1; // Generate new ID
          const adres = addresses[Math.floor(Math.random() * addresses.length)]; // Select random address from the array
          const dostepnosc = generateRandomNumber(0, 100); // Random dostepnosc value (between 0 and 100)

          insertPromises.push(
            connection.execute(insertSql, [id_magazyn, adres, dostepnosc])
          );

          // Push SQL statement into the array
          sqlStatements.push(`INSERT INTO magazyn VALUES (${id_magazyn}, '${adres}', ${dostepnosc});`);
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        fs.appendFileSync('src/app/inserts.sql', sqlStatements.join('\n') + '\n');
        console.log('SQL statements written to inserts.sql');

        console.log(`${howMany} records inserted into magazyn successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into magazyn:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomMagazynData(numberOfRows || 10, connection);
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
