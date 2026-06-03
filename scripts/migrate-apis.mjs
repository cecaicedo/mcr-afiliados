import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const tables = [
  {
    name: 'api_credentials',
    sql: `CREATE TABLE IF NOT EXISTS api_credentials (
      id int AUTO_INCREMENT NOT NULL,
      plataforma enum('whatsapp','instagram','tiktok') NOT NULL,
      tokenAcceso text NOT NULL,
      numeroTelefono varchar(20),
      idCuenta varchar(200),
      nombreCuenta varchar(200),
      activo boolean NOT NULL DEFAULT true,
      ultimaVerificacion timestamp,
      createdAt timestamp NOT NULL DEFAULT (now()),
      updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id)
    )`
  },
  {
    name: 'mensajes_whatsapp',
    sql: `CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
      id int AUTO_INCREMENT NOT NULL,
      leadId int NOT NULL,
      contenido text NOT NULL,
      estado enum('pendiente','enviado','entregado','leido','error') NOT NULL DEFAULT 'pendiente',
      idMensajeWhatsapp varchar(200),
      error text,
      createdAt timestamp NOT NULL DEFAULT (now()),
      enviadoEn timestamp,
      PRIMARY KEY(id)
    )`
  },
  {
    name: 'publicaciones_redes',
    sql: `CREATE TABLE IF NOT EXISTS publicaciones_redes (
      id int AUTO_INCREMENT NOT NULL,
      plataforma enum('instagram','tiktok') NOT NULL,
      contenido text NOT NULL,
      imagenes json DEFAULT ('[]'),
      videos json DEFAULT ('[]'),
      hashtags json DEFAULT ('[]'),
      estado enum('borrador','programada','publicada','error') NOT NULL DEFAULT 'borrador',
      idPublicacion varchar(200),
      fechaPublicacion timestamp,
      error text,
      createdAt timestamp NOT NULL DEFAULT (now()),
      updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(id)
    )`
  }
];

for (const table of tables) {
  try {
    await connection.execute(table.sql);
    console.log(`✓ ${table.name}`);
  } catch (error) {
    console.error(`✗ ${table.name}:`, error.message);
  }
}

console.log('Migración de APIs completada');
await connection.end();
