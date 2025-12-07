const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME || 'roc4tech_attendance', process.env.DB_USER || 'roc4tech_user', process.env.DB_PASSWORD || 'your_secure_password', {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
});

async function checkIndexes() {
    try {
        const [results, metadata] = await sequelize.query(`
      SELECT
        t.relname as table_name,
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        and i.oid = ix.indexrelid
        and a.attrelid = t.oid
        and a.attnum = ANY(ix.indkey)
        and t.relkind = 'r'
        and t.relname = 'Attendances'
      ORDER BY
        t.relname,
        i.relname;
    `);

        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkIndexes();
