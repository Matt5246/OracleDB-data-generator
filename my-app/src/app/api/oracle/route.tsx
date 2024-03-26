import { NextResponse } from "next/server";
const oracledb = require('oracledb');

// Set the database connection configuration
const dbConfig = {
  user: 's104733',
  password: 's104733',
  connectString: '217.173.198.135:1521/tpdb' // Host:Port/ServiceName or Host:Port/SID
};

// Create an async function to handle database operations
export async function GET(req: Request) {
  let connection;
  let result = undefined;
  try {
    // Get a connection from the pool
    connection = await oracledb.getConnection(dbConfig);

    // Create a new table
    await connection.execute(`
      CREATE TABLE example_table (
        id NUMBER PRIMARY KEY,
        name VARCHAR2(50)
      )
    `);
    console.log('Table created successfully.');

    
    const insertSql = `INSERT INTO example_table (id, name) VALUES (:id, :name)`;
    const binds = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ];
    await connection.executeMany(insertSql, binds);

    result = await connection.execute(
      `SELECT table_name FROM user_tables WHERE table_name = 'EXAMPLE_TABLE'`
    );
    
    console.log(result.rows); 
    if (result.rows.length > 0) {
        console.log('Table exists:', result.rows[0][0]);
      } else {
        console.log('Table does not exist.');
      }
  
      await connection.execute('DROP TABLE example_table');
      console.log('Table deleted successfully.');
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
    return NextResponse.json({ message: result });
}


