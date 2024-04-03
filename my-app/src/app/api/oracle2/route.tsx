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
  let result = undefined;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    // Define the function to get the IDs of existing rows
    const getExistingIds = async (connection:any) => {
      const query = 'SELECT id_klient FROM Klient';
      const result = await connection.execute(query);
      return result.rows.map((row:any) => row[0]); // Extract IDs from the result
    };

    // Define the insert function to insert random klient data
    const insertRandomKlient = async (howMany:any, connection:any) => {
      const existingIds = await getExistingIds(connection);
      const startingId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1; // Calculate starting ID for new rows

      const names = ['Adam', 'Barbara', 'Celina', 'Dariusz', 'Ewa', 'Filip', 'Gabriela', 'Henryk', 'Izabela', 'Jan'];
      const surnames = ['Kowalski', 'Nowak', 'Mazur', 'Wójcik', 'Krawczyk', 'Lewandowski', 'Piotrowski', 'Szymański', 'Woźniak'];
      const postal_codes = ['01-100', '02-200', '03-300', '04-400', '05-500', '06-600', '07-700', '08-800', '09-900', '10-100'];
      const city = ['Warszawa', 'Kraków', 'Gdańsk', 'Poznań', 'Wrocław', 'Katowice', 'Szczecin', 'Lublin', 'Białystok', 'Olsztyn'];
      const street = ['Kwiatowa', 'Słoneczna', 'Brzozowa', 'Akacjowa', 'Dębowa', 'Topolowa', 'Świerkowa', 'Lipowa', 'Jesionowa', 'Wiśniowa'];

      const insertSql = `INSERT INTO Klient (id_klient, imie, nazwisko, miejscowosc, kod_pocztowy, ulica, nr_domu, nr_lokalu, nr_telefonu) 
        VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9)`;

      try {
        const insertPromises = [];

        for (let i = 0; i < howMany; i++) {
          const Imie = names[Math.floor(Math.random() * names.length)];
          const Nazwisko = surnames[Math.floor(Math.random() * surnames.length)];
          const Miejscowosc = city[Math.floor(Math.random() * city.length)];
          const Kod_pocztowy = postal_codes[Math.floor(Math.random() * postal_codes.length)];
          const Ulica = street[Math.floor(Math.random() * street.length)];
          const Numer_domu = Math.floor(Math.random() * 200) + 1;
          const Numer_mieszkania = Math.floor(Math.random() * 50) + 1;
          const Numer_telefonu = Math.floor(Math.random() * 900000000) + 100000000;

          insertPromises.push(
            connection.execute(insertSql, [startingId + i, Imie, Nazwisko, Miejscowosc, Kod_pocztowy, Ulica, Numer_domu, Numer_mieszkania, Numer_telefonu])
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
        throw insertError;
      }
    };

    await insertRandomKlient(10, connection);

    result = await connection.execute('SELECT * FROM Klient');
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

  return NextResponse.json({ data: result?.rows || [] });
}
