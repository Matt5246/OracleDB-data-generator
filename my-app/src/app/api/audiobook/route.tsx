import { NextResponse } from "next/server";
import { oracledb, dbConfig } from "@/lib/oracle";
import fs from 'fs';

export function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const titles = [
  'The Power of Habit: Why We Do What We Do in Life and Business',
  'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
  'The Subtle Art of Not Giving a F*ck: A Counterintuitive Approach to Living a Good Life',
  'Educated: A Memoir',
  'Becoming',
  'Where the Crawdads Sing',
  'Sapiens: A Brief History of Humankind',
  'The Four Agreements: A Practical Guide to Personal Freedom',
  'The Alchemist',
  'Born a Crime: Stories from a South African Childhood'
];

const intros = [
  'Explore the mysteries of the universe with our latest audiobook collection.',
  'Dive into the world of fantasy and magic with these captivating audiobooks.',
  'Experience thrilling adventures and heart-pounding suspense in our action-packed audiobooks.',
  'Discover the secrets of success and personal growth through our inspiring audiobooks.',
  'Escape to distant lands and lost civilizations with our epic historical audiobooks.'
];

// Example data arrays for publishing houses
const publishingHouses = ['Penguin Random House', 'HarperCollins Publishers', 'Simon & Schuster', 'Hachette Livre', 'Macmillan Publishers'];

// Example data arrays for categories
const categories = ['Science Fiction', 'Fantasy', 'Mystery & Thriller', 'Self-Help', 'Historical Fiction'];

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
        const sqlStatements = [];

        for (let i = 0; i < howMany; i++) {
          const id_audio = existingAudioIds.length > 0 ? Math.max(...existingAudioIds) + i + 1 : i + 1; // Generate new ID
          const tytul = titles[Math.floor(Math.random() * titles.length)];
          const dlugosc = `${generateRandomNumber(1, 20)}h ${generateRandomNumber(0, 59)}m`; // Random dlugosc value
          const intro = intros[Math.floor(Math.random() * intros.length)]; // Example intro
          const cena = generateRandomNumber(10, 100); // Random cena value
          const wydawnictwo = publishingHouses[Math.floor(Math.random() * publishingHouses.length)]; // Random publishing house
          const kategoria = categories[Math.floor(Math.random() * categories.length)]; // Random category
          const kz_id_zamowienia = existingZamowieniaIds[Math.floor(Math.random() * existingZamowieniaIds.length)];
          const koszyk_id_koszyk = existingKoszykIds[Math.floor(Math.random() * existingKoszykIds.length)];
          const kz_konta_id_konta = existingKontaIds[Math.floor(Math.random() * existingKontaIds.length)];
          const kz_konta_id_historia_z = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)];

          const sqlStatement = connection.executeMany(insertSql, [[id_audio, tytul, dlugosc, intro, cena, wydawnictwo, kategoria, kz_id_zamowienia, koszyk_id_koszyk, kz_konta_id_konta, kz_konta_id_historia_z]], { autoCommit: true });
          insertPromises.push(sqlStatement);

          // Push SQL statement into the array
          sqlStatements.push(`INSERT INTO audiobooki VALUES (${id_audio}, '${tytul}', '${dlugosc}', '${intro}', ${cena}, '${wydawnictwo}', '${kategoria}', ${kz_id_zamowienia}, ${koszyk_id_koszyk}, ${kz_konta_id_konta}, ${kz_konta_id_historia_z});`);


        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        fs.appendFileSync('src/app/inserts.sql', sqlStatements.join('\n') + '\n');
        console.log('SQL statements written to inserts.txt');

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
