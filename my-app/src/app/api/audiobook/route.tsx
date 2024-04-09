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

    // Define the insert function to insert random audiobooki data
    const insertRandomAudiobooki = async (howMany: number, connection: any) => {
      const titles = ['Title 1', 'Title 2', 'Title 3', 'Title 4', 'Title 5'];
      const lengths = ['1 hour', '1.5 hours', '2 hours', '2.5 hours', '3 hours'];
      const intros = ['Introduction 1', 'Introduction 2', 'Introduction 3', 'Introduction 4', 'Introduction 5'];
      const prices = [10.99, 12.99, 14.99, 16.99, 19.99];
      const publishers = ['Publisher 1', 'Publisher 2', 'Publisher 3', 'Publisher 4', 'Publisher 5'];
      const categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'];

      const insertSql = `INSERT INTO audiobooki (id_audio, tytul, dlugosc, intro, cena, wydawnictwo, kategoria, kz_id_zamowienia, koszyk_id_koszyk, kz_konta_id_konta, kz_konta_id_historia_z) 
        VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11)`;
        const getExistingAudiobookIds = async () => {
            const query = 'SELECT id_audio FROM audiobooki';
            const result = await connection.execute(query);
            return result.rows.map((row:any) => row[0]);
          };
      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
            const existingIds = await getExistingAudiobookIds(); // Start ID for new rows
            const startingId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            const Tytul = titles[Math.floor(Math.random() * titles.length)];
            const Dlugosc = lengths[Math.floor(Math.random() * lengths.length)];
            const Intro = intros[Math.floor(Math.random() * intros.length)];
            const Cena = prices[Math.floor(Math.random() * prices.length)];
            const Wydawnictwo = publishers[Math.floor(Math.random() * publishers.length)];
            const Kategoria = categories[Math.floor(Math.random() * categories.length)];
            const Kz_id_zamowienia = Math.floor(Math.random() * 100) + 1; // Random value between 1 and 100
            const Koszyk_id_koszyk = Math.floor(Math.random() * 100) + 1; // Random value between 1 and 100
            const Kz_konta_id_konta = Math.floor(Math.random() * 100) + 1; // Random value between 1 and 100
            const Kz_konta_id_historia_z = Math.floor(Math.random() * 100) + 1; // Random value between 1 and 100

            insertPromises.push(
                connection.execute(insertSql, [startingId, Tytul, Dlugosc, Intro, Cena, Wydawnictwo, Kategoria, Kz_id_zamowienia, Koszyk_id_koszyk, Kz_konta_id_konta, Kz_konta_id_historia_z])
            );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomAudiobooki(10, connection);
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
