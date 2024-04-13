import { NextResponse } from "next/server";
import { oracledb, dbConfig } from "@/lib/oracle";
import fs from 'fs';

// Helper function to get the IDs of existing rows
const getExistingIds = async (connection) => {
  const query = 'SELECT id_klienta FROM Klient';
  const result = await connection.execute(query);
  return result.rows.map((row) => row[0]); // Extract IDs from the result
};

// Helper function to generate a random number between min and max (inclusive)
const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json(new Error('Method Not Allowed'), { status: 405 });
  }

  const { numberOfRows } = await req.json();
  let connection;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    // Define the insert function to insert random klient data
    const insertRandomKlient = async (howMany, connection) => {
      const existingIds = await getExistingIds(connection);
      const startingId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1; // Calculate starting ID for new rows

      const names = ['Adam', 'Barbara', 'Celina', 'Dariusz', 'Ewa', 'Filip', 'Gabriela', 'Henryk', 'Izabela', 'Jan'];
      const surnames = ['Kowalski', 'Nowak', 'Mazur', 'Wójcik', 'Krawczyk', 'Lewandowski', 'Piotrowski', 'Szymański', 'Woźniak'];
      const postal_codes = ['01-100', '02-200', '03-300', '04-400', '05-500', '06-600', '07-700', '08-800', '09-900', '10-100'];
      const city = ['Warszawa', 'Kraków', 'Gdańsk', 'Poznań', 'Wrocław', 'Katowice', 'Szczecin', 'Lublin', 'Białystok', 'Olsztyn'];
      const street = ['Kwiatowa', 'Słoneczna', 'Brzozowa', 'Akacjowa', 'Dębowa', 'Topolowa', 'Świerkowa', 'Lipowa', 'Jesionowa', 'Wiśniowa'];

      const insertSql = `INSERT INTO Klient (id_klienta, imie, nazwisko, adres, numer_telefonu) 
        VALUES (:1, :2, :3, :4, :5)`;

      try {
        const insertPromises = [];
        const sqlStatements = [];

        for (let i = 0; i < howMany; i++) {
          const Imie = names[Math.floor(Math.random() * names.length)];
          const Nazwisko = surnames[Math.floor(Math.random() * surnames.length)];
          const Adres = `${city[Math.floor(Math.random() * city.length)]}, ul. ${street[Math.floor(Math.random() * street.length)]}`;
          const Numer_telefonu = Math.floor(Math.random() * 900000000) + 100000000;

          insertPromises.push(
            connection.execute(insertSql, [startingId + i, Imie, Nazwisko, Adres, Numer_telefonu])
          );

          // Push SQL statement into the array
          sqlStatements.push(`INSERT INTO Klient VALUES (${startingId + i}, '${Imie}', '${Nazwisko}', '${Adres}', ${Numer_telefonu});`);
        }

        // Execute all insert queries concurrently
        await Promise.all(insertPromises);

        // Commit the transaction
        await connection.commit();

        fs.appendFileSync('src/app/inserts.sql', sqlStatements.join('\n') + '\n');
        console.log('SQL statements written to inserts.txt');

        console.log(`${howMany} records inserted successfully.`);
      } catch (insertError) {
        // Rollback the transaction if any insert fails
        await connection.rollback();
        console.error('Error inserting records:', insertError);
        throw insertError; // Rethrow the error for proper handling
      }
    };

    // Call the insert function with the desired number of records
    await insertRandomKlient(numberOfRows || 10, connection);
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
