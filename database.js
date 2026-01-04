const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'codigos.db'));
        this.init();
    }

    init() {
        // Crear tabla si no existe
        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS codigos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    codigo TEXT NOT NULL,
                    servicio TEXT,
                    mensaje TEXT,
                    asunto TEXT,
                    fecha_envio DATETIME,
                    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                    estado TEXT DEFAULT 'activo',
                    dominio TEXT,
                    UNIQUE(email, codigo, fecha_envio)
                )
            `);

            // Crear índices para mejor rendimiento
            this.db.run(`
                CREATE INDEX IF NOT EXISTS idx_email ON codigos(email)
            `);

            this.db.run(`
                CREATE INDEX IF NOT EXISTS idx_codigo ON codigos(codigo)
            `);

            console.log('Base de datos inicializada correctamente');
        });
    }

    // Guardar un nuevo código
    async guardarCodigo(email, codigo, servicio, mensaje, asunto, fechaEnvio, dominio) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT OR REPLACE INTO codigos 
                (email, codigo, servicio, mensaje, asunto, fecha_envio, dominio)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [email, codigo, servicio, mensaje, asunto, fechaEnvio, dominio], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, email, codigo });
                }
            });
        });
    }

    // Obtener el último código de Disney+ por email
    async obtenerUltimoCodigoDisney(email) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM codigos 
                WHERE email = ? AND (servicio LIKE '%disney%' OR servicio LIKE '%Disney%')
                ORDER BY fecha_envio DESC, id DESC
                LIMIT 1
            `;
            
            this.db.all(sql, [email], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Obtener códigos por email (método original para admin)
    async obtenerCodigosPorEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM codigos 
                WHERE email = ? 
                ORDER BY fecha_envio DESC
            `;
            
            this.db.all(sql, [email], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Obtener todos los códigos (para admin)
    async obtenerTodosLosCodigos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM codigos 
                ORDER BY fecha_registro DESC
                LIMIT 100
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Marcar código como usado/expirado
    async actualizarEstado(codigoId, estado) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE codigos SET estado = ? WHERE id = ?';
            
            this.db.run(sql, [estado, codigoId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Eliminar códigos antiguos (más de 30 días)
    async limpiarCodigosAntiguos() {
        return new Promise((resolve, reject) => {
            const sql = `
                DELETE FROM codigos 
                WHERE fecha_registro < datetime('now', '-30 days')
            `;
            
            this.db.run(sql, [], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deleted: this.changes });
                }
            });
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;
