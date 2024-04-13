import { NextResponse } from "next/server";
import { oracledb, dbConfig } from "@/lib/oracle";

// Helper function to generate a random number between min and max (inclusive)
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json(new Error('Method Not Allowed'), { status: 405 });
  }
  let connection;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    // Define the insert function to insert random data into the platnosci and zamowienia tables
    const insertRandomData = async (howMany, connection) => {
      const insertPlatnosciSql = `INSERT INTO platnosci (id_platnosci, suma, "Data-platnosci", rodzaj_platnosci, czy_oplacone, zamówienia_id_zamowienia, zamówienia_konta_id_konta, zamówienia_konta_id_historia_z) 
        VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`;

      const insertZamowieniaSql = `INSERT INTO zamówienia (id_zamowienia, platnosci_id_platnosci, konta_id_konta, stan_zamowienia, konta_id_historia_z) 
        VALUES (:1, :2, :3, :4, :5)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
          const id_platnosci = i + 1; // Generate new platnosci ID
          const id_zamowienia = i + 1; // Generate new zamowienia ID
          const suma = generateRandomNumber(10, 1000); // Random suma value
          const data_platnosci = new Date(); // Current date
          const rodzaj_platnosci = Math.random() < 0.5 ? 'blik' : 'przelew'; // Random rodzaj_platnosci value
          const czy_oplacone = Math.random() < 0.8 ? 1 : 0; // Random czy_oplacone value (80% chance of being 1)
          const stan_zamowienia = generateRandomNumber(0, 2); // Random stan_zamowienia value (0, 1, or 2)

          insertPromises.push(
            connection.execute(insertPlatnosciSql, [id_platnosci, suma, data_platnosci, rodzaj_platnosci, czy_oplacone, id_zamowienia, 1, 1]), // Replace 1 with appropriate konta_id_konta and konta_id_historia_z values
            connection.execute(insertZamowieniaSql, [id_zamowienia, id_platnosci, 1, stan_zamowienia, 1]) // Replace 1 with appropriate platnosci_id_platnosci value
          );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted into platnosci and zamowienia successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into platnosci and zamowienia:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomData(100, connection); // Replace 10 with the desired number of records
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
