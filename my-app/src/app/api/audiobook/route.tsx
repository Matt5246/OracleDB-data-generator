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

    // Define the insert function to insert random data into the audiobooki table
    const insertRandomAudiobookiData = async (howMany, connection) => {
        const existingAudioIds = await getExistingIds('audiobooki', 'id_audio');
      const existingKoszykIds = await getExistingIds('koszyk', 'id_koszyk');
      const existingZamowieniaIds = await getExistingIds('zamówienia', 'id_zamowienia');
      const existingKontaIds = await getExistingIds('konta', 'id_konta');
      const existingHistoriaZamowienIds = await getExistingIds('historia_zamowien', 'id_historia_z');

      const insertSql = `INSERT INTO audiobooki (id_audio, tytul, dlugosc, intro, cena, wydawnictwo, kategoria, kz_id_zamowienia, koszyk_id_koszyk, kz_konta_id_konta, kz_konta_id_historia_z) 
        VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
          const id_audio = existingAudioIds.length > 0 ? Math.max(...existingAudioIds) + i + 1 : i + 1; // Generate new ID
          const tytul = `Audiobook ${i+1}`; // Example tytul
          const dlugosc = `${generateRandomNumber(1, 20)}h ${generateRandomNumber(0, 59)}m`; // Random dlugosc value
          const intro = `Intro ${i+1}`; // Example intro
          const cena = generateRandomNumber(10, 100); // Random cena value
          const wydawnictwo = `Wydawnictwo ${i+1}`; // Example wydawnictwo
          const kategoria = `Kategoria ${i+1}`; // Example kategoria
          const kz_id_zamowienia = existingZamowieniaIds[Math.floor(Math.random() * existingZamowieniaIds.length)];
          const koszyk_id_koszyk = existingKoszykIds[Math.floor(Math.random() * existingKoszykIds.length)];
          const kz_konta_id_konta = existingKontaIds[Math.floor(Math.random() * existingKontaIds.length)];
          const kz_konta_id_historia_z = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)];

          insertPromises.push(
            connection.execute(insertSql, [id_audio, tytul, dlugosc, intro, cena, wydawnictwo, kategoria, kz_id_zamowienia, koszyk_id_koszyk, kz_konta_id_konta, kz_konta_id_historia_z])
          );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted into audiobooki successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into audiobooki:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomAudiobookiData(numberOfRows || 10, connection); 
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
