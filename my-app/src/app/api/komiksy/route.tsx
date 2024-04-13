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

    // Define the insert function to insert random data into the komiksy table
    const insertRandomKomiksyData = async (howMany, connection) => {
      const existingKomiksyIds = await getExistingIds('komiksy', 'id_komiksu');
      const existingZamowieniaIds = await getExistingIds('zamówienia', 'id_zamowienia');
      const existingKontaIds = await getExistingIds('konta', 'id_konta');
      const existingHistoriaZamowienIds = await getExistingIds('historia_zamowien', 'id_historia_z');
      const existingMagazynIds = await getExistingIds('magazyn', 'id_magazyn');
      const existingKoszykIds = await getExistingIds('koszyk', 'id_koszyk');

      const titles = ['The Heroic Adventures', 'Mysteries of the Unknown', 'Sci-Fi Chronicles', 'Fantasy Realms', 'Horror Tales'];
      const categories = ['Superhero', 'Fantasy', 'Sci-Fi', 'Mystery', 'Horror'];

      const intros = [
        'Follow the thrilling journey of a young hero as they discover their destiny and face countless challenges.',
        'Delve into the mysterious world of the unknown, where secrets lurk in every corner and danger awaits the curious.',
        'Embark on an epic adventure through distant galaxies and encounter strange creatures and ancient civilizations.',
        'Explore fantastical realms filled with magic, mythical creatures, and epic battles between good and evil.',
        'Experience bone-chilling terror as you journey into the heart of darkness and face unimaginable horrors.'
      ];

      const publishingHouses = ['Marvel Comics', 'DC Comics', 'Dark Horse Comics', 'Image Comics', 'IDW Publishing'];

      const insertSql = `INSERT INTO komiksy (id_komiksu, tytul, intro, cena, liczba_stron, ilosc_sztuk, wydawnictwo, kategoria, kz_id_zamowienia, kz_konta_id_konta, kz_konta_id_historia_z, koszyk_id_koszyk, magazyn_id_magazyn) 
        VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
          const id_komiksu = existingKomiksyIds.length > 0 ? Math.max(...existingKomiksyIds) + i + 1 : i + 1; // Generate new ID

          const tytul = titles[Math.floor(Math.random() * titles.length)];
          const intro = intros[Math.floor(Math.random() * intros.length)];
          const cena = generateRandomNumber(5, 50); // Random cena value (between 5 and 50)
          const liczba_stron = generateRandomNumber(20, 200); // Random liczba_stron value (between 20 and 200)
          const ilosc_sztuk = generateRandomNumber(1, 50); // Random ilosc_sztuk value (between 1 and 50)
          const wydawnictwo = publishingHouses[Math.floor(Math.random() * publishingHouses.length)];
          const kategoria = categories[Math.floor(Math.random() * categories.length)];
          const kz_id_zamowienia = existingZamowieniaIds[Math.floor(Math.random() * existingZamowieniaIds.length)];
          const kz_konta_id_konta = existingKontaIds[Math.floor(Math.random() * existingKontaIds.length)];
          const kz_konta_id_historia_z = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)];
          const koszyk_id_koszyk = existingKoszykIds[Math.floor(Math.random() * existingKoszykIds.length)];
          const magazyn_id_magazyn = existingMagazynIds[Math.floor(Math.random() * existingMagazynIds.length)];

          insertPromises.push(
            connection.execute(insertSql, [id_komiksu, tytul, intro, cena, liczba_stron, ilosc_sztuk, wydawnictwo, kategoria, kz_id_zamowienia, kz_konta_id_konta, kz_konta_id_historia_z, koszyk_id_koszyk, magazyn_id_magazyn])
          );
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        console.log(`${howMany} records inserted into komiksy successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records into komiksy:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomKomiksyData(numberOfRows || 10, connection);
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
