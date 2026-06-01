import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const tables = [
  // leads - sin json default
  `CREATE TABLE IF NOT EXISTS leads (
    id int AUTO_INCREMENT NOT NULL,
    nombre varchar(200) NOT NULL,
    email varchar(320),
    telefono varchar(30),
    estado enum('nuevo','contactado','interesado','compro','perdido') NOT NULL DEFAULT 'nuevo',
    fuente varchar(100),
    campana varchar(100),
    productoInteresId int,
    etiquetasIds json,
    notas text,
    ultimaInteraccion timestamp NULL DEFAULT NULL,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  // plantillas_mensajes - sin json default
  `CREATE TABLE IF NOT EXISTS plantillas_mensajes (
    id int AUTO_INCREMENT NOT NULL,
    nombre varchar(200) NOT NULL,
    contenido text NOT NULL,
    variables json,
    categoria enum('bienvenida','seguimiento','carrito_abandonado','post_venta','recordatorio','general') NOT NULL DEFAULT 'general',
    generadaPorIA boolean NOT NULL DEFAULT false,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  // reglas_seguimiento - sin json default
  `CREATE TABLE IF NOT EXISTS reglas_seguimiento (
    id int AUTO_INCREMENT NOT NULL,
    nombre varchar(200) NOT NULL,
    diasInactividad int NOT NULL DEFAULT 3,
    estadosAplicables json,
    plantillaId int NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
];

for (const sql of tables) {
  try {
    await conn.execute(sql);
    const name = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    console.log(`✓ ${name}`);
  } catch (e) {
    if (e.message?.includes("already exists")) {
      const name = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
      console.log(`~ ${name} (ya existe)`);
    } else {
      console.error(`✗ Error:`, e.message);
    }
  }
}

await conn.end();
console.log("Migración completada");
