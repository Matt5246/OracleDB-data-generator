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

    // Define the insert function to insert random data into the ksiazki table
    const insertRandomKsiazkiData = async (howMany, connection) => {
      const existingKsiazkiIds = await getExistingIds('ksiazki', 'id_ksiazki');
      const existingZamowieniaIds = await getExistingIds('zamówienia', 'id_zamowienia');
      const existingKontaIds = await getExistingIds('konta', 'id_konta');
      const existingHistoriaZamowienIds = await getExistingIds('historia_zamowien', 'id_historia_z');
      const existingMagazynIds = await getExistingIds('magazyn', 'id_magazyn');
      const existingKoszykIds = await getExistingIds('koszyk', 'id_koszyk');

      const insertSql = `INSERT INTO ksiazki (id_ksiazki, tytul, liczba_stron, ilosc_sztuk, intro, cena, wydawnictwo, kategoria, kz_id_zamowienia, koszyk_id_koszyk, kz_konta_id_konta, kz_konta_id_historia_z, magazyn_id_magazyn) 
        VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
          const id_ksiazki = existingKsiazkiIds.length > 0 ? Math.max(...existingKsiazkiIds) + i + 1 : i + 1; // Generate new ID
          const tytul = `Tytul ${i + 1}`; // Example tytul
          const liczba_stron = generateRandomNumber(100, 500); // Random liczba_stron value (between 100 and 500)
          const ilosc_sztuk = generateRandomNumber(1, 100); // Random ilosc_sztuk value (between 1 and 100)
          const intro = `Intro ${i + 1}`; // Example intro
          const cena = generateRandomNumber(10, 100); // Random cena value (between 10 and 100)
          const wydawnictwo = `Wydawnictwo ${i + 1}`; // Example wydawnictwo
          const kategoria = Math.random() < 0.5 ? 'Fikcja' : 'Non-Fikcja'; // Random kategoria value
          const kz_id_zamowienia = existingZamowieniaIds[Math.floor(Math.random() * existingZamowieniaIds.length)];
          const koszyk_id_koszyk = existingKoszykIds[Math.floor(Math.random() * existingKoszykIds.length)];
          const kz_konta_id_konta = existingKontaIds[Math.floor(Math.random() * existingKontaIds.length)];
          const kz_konta_id_historia_z = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)];
          const magazyn_id_magazyn = existingMagazynIds[Math.floor(Math.random() * existingMagazynIds.length)];

          insertPromises.push(
            connection.execute(insertSql, [id_ksiazki, tytul, liczba_stron, ilosc_sztuk, intro, cena, wydawnictwo, kategoria, kz_id_zamowienia, koszyk_id_koszyk, kz_konta_id_konta, kz_konta_id_historia_z, magazyn_id_magazyn])
          );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted into ksiazki successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into ksiazki:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomKsiazkiData(numberOfRows || 100, connection);
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
  return NextResponse.json({ message: `Data generation completed. inserted ${numberOfRows || 100} rows` });
}
