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
  let connection;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    const getExistingIds = async (tableName, idColumnName) => {
      const query = `SELECT ${idColumnName} FROM ${tableName}`;
      const result = await connection.execute(query);
      return result.rows.map((row) => row[0]);
    };

    // Define the insert function to insert random data into the platnosci and zamowienia tables
    const insertRandomData = async (howMany, connection) => {
      const existingPlatnosciIds = await getExistingIds('platnosci', 'id_platnosci');
      const existingZamowieniaIds = await getExistingIds('zamówienia', 'id_zamowienia');
      const existingKontaIds = await getExistingIds('konta', 'id_konta');
      const existingHistoriaZamowienIds = await getExistingIds('historia_zamowien', 'id_historia_z');
      const insertPlatnosciSql = `INSERT INTO platnosci (id_platnosci, suma, "Data-platnosci", rodzaj_platnosci, czy_oplacone, zamówienia_id_zamowienia, zamówienia_konta_id_konta, zamówienia_konta_id_historia_z) 
                        VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`;

      const insertZamowieniaSql = `INSERT INTO zamówienia (id_zamowienia, platnosci_id_platnosci, konta_id_konta, stan_zamowienia, konta_id_historia_z) 
                        VALUES (:1, :2, :3, :4, :5)`;
      const rodzajPlatnosciArray = ['karta', 'przelew', 'PayPal', 'blik', 'Google Pay'];

      try {
        const insertPromises = [];
        const sqlStatements = [];

        for (let i = 0; i < howMany; i++) {
          const id_platnosci = existingPlatnosciIds.length > 0 ? Math.max(...existingPlatnosciIds) + i + 1 : i + 1; // Generate new platnosci ID
          const id_zamowienia = existingZamowieniaIds.length > 0 ? Math.max(...existingZamowieniaIds) + i + 1 : i + 1; // Generate new zamowienia ID
          const id_konta = existingKontaIds[Math.floor(Math.random() * existingKontaIds.length)]; // Random konta_id_konta value
          const id_historia_z = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)]; // Random konta_id_historia_z value
          const suma = generateRandomNumber(10, 1000); // Random suma value
          const data_platnosci = new Date(); // Current date
          const rodzaj_platnosci = rodzajPlatnosciArray[Math.floor(Math.random() * rodzajPlatnosciArray.length)];
          const czy_oplacone = Math.random() < 0.8 ? 1 : 0; // Random czy_oplacone value (80% chance of being 1)
          const stan_zamowienia = generateRandomNumber(0, 2); // Random stan_zamowienia value (0, 1, or 2)

          insertPromises.push(
            connection.execute(insertPlatnosciSql, [id_platnosci, suma, data_platnosci, rodzaj_platnosci, czy_oplacone, id_zamowienia, 1, 1]), // Replace 1 with appropriate konta_id_konta and konta_id_historia_z values
            connection.execute(insertZamowieniaSql, [id_zamowienia, id_platnosci, id_konta, stan_zamowienia, id_historia_z]) // Replace 1 with appropriate platnosci_id_platnosci value
          );

          // Push SQL statements into the array
          sqlStatements.push(`INSERT INTO platnosci VALUES (${id_platnosci}, ${suma}, TO_DATE('${data_platnosci.toISOString().slice(0, 19).replace('T', ' ')}', 'YYYY-MM-DD HH24:MI:SS'), '${rodzaj_platnosci}', ${czy_oplacone}, ${id_zamowienia}, 1, 1);`);
          sqlStatements.push(`INSERT INTO zamówienia VALUES (${id_zamowienia}, ${id_platnosci}, ${id_konta}, ${stan_zamowienia}, ${id_historia_z});`);
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        fs.appendFileSync('src/app/inserts.sql', sqlStatements.join('\n') + '\n');
        console.log('SQL statements written to inserts.sql');

        console.log(`${howMany} records inserted into platnosci and zamowienia successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into platnosci and zamowienia:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomData(numberOfRows, connection); // Replace 10 with the desired number of records
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
