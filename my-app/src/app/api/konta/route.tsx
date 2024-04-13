import { NextResponse } from "next/server";
import { oracledb, dbConfig } from "@/lib/oracle";
import fs from 'fs';

function generateRandomPassword() {
    return Math.random().toString(36).substring(2, 10);
}

const allNicknames = ['matt', 'helikopterBojowy', 'jane', 'sunny', 'rocket', 'thunder', 'shadow', 'buyer', 'Pakleza', 'Carlsen112', 'HikaruNaSkraju'];
const domains = ['gmail.com', 'interia.com', 'wp.pl', 'yahoo.com', 'outlook.com', 'aol.com', 'protonmail.com'];

function generateRandomEmail() {
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const nickname = allNicknames[Math.floor(Math.random() * allNicknames.length)];
    return `${nickname}${Math.floor(Math.random() * 1000)}@${randomDomain}`;
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

        // Define the insert function to insert random data into the konta table
        const insertRandomKontaData = async (howMany, connection) => {
            const existingKlientIds = await getExistingIds('Klient', 'id_klienta');
            const existingHistoriaZamowienIds = await getExistingIds('Historia_zamowien', 'id_historia_z');
            const existingIds = await getExistingIds('Konta', 'id_konta'); // Start ID for new rows
            const startingId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            const insertSql = `INSERT INTO Konta (id_konta, haslo, email, klient_id_klienta, historia_zamowien_id_hz) 
                VALUES (:1, :2, :3, :4, :5)`;

            try {
                const insertPromises = [];
                const sqlStatements = [];

                for (let i = 0; i < howMany; i++) {
                    const id_konta = startingId + i;
                    const haslo = generateRandomPassword();
                    const email = generateRandomEmail();
                    const klient_id_klienta = existingKlientIds[Math.floor(Math.random() * existingKlientIds.length)];
                    const historia_zamowien_id_hz = existingHistoriaZamowienIds[Math.floor(Math.random() * existingHistoriaZamowienIds.length)];

                    insertPromises.push(
                        connection.execute(insertSql, [id_konta, haslo, email, klient_id_klienta, historia_zamowien_id_hz])
                    );

                    // Push SQL statement into the array
                    sqlStatements.push(`INSERT INTO Konta VALUES (${id_konta}, '${haslo}', '${email}', ${klient_id_klienta}, ${historia_zamowien_id_hz});`);
                }

                // Execute all insert queries concurrently
                await Promise.all(insertPromises);

                // Commit the transaction
                await connection.commit();

                fs.appendFileSync('src/app/inserts.sql', sqlStatements.join('\n') + '\n');
                console.log('SQL statements written to inserts.txt');

                console.log(`${howMany} records inserted into Konta successfully.`);
            } catch (insertError) {
                // Rollback the transaction if any insert fails
                await connection.rollback();
                console.error('Error inserting records into Konta:', insertError);
                throw insertError; // Rethrow the error for proper handling
            }
        };

        // Call the insert function with the desired number of records
        await insertRandomKontaData(numberOfRows || 100, connection);
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
    return NextResponse.json({ message: `Data generation completed. Inserted ${numberOfRows || 100} rows into Konta.` });
}
