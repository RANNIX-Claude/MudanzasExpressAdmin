-- Mudanzas Express — esquema para Azure SQL Database
-- Ejecutar una vez en tu base de datos (via Query Editor del portal de Azure,
-- Azure Data Studio, o SSMS).

CREATE TABLE dbo.Contratos (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    fecha_generado  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    servicio_id     NVARCHAR(100)  NULL,
    vendedor        NVARCHAR(100)  NULL,
    cliente         NVARCHAR(200)  NULL,
    representante   NVARCHAR(200)  NULL,
    tipo            NVARCHAR(100)  NULL,
    origen          NVARCHAR(500)  NULL,
    destino         NVARCHAR(500)  NULL,
    fecha_servicio  NVARCHAR(20)   NULL,
    hora            NVARCHAR(20)   NULL,
    viajes          INT            NULL DEFAULT 1,
    equipo          NVARCHAR(200)  NULL,
    total           DECIMAL(10,2)  NULL DEFAULT 0,
    anticipo        DECIMAL(10,2)  NULL DEFAULT 0,
    liquidacion     DECIMAL(10,2)  NULL DEFAULT 0,
    notas           NVARCHAR(MAX)  NULL
);

CREATE INDEX IX_Contratos_fecha_servicio ON dbo.Contratos(fecha_servicio);
CREATE INDEX IX_Contratos_cliente ON dbo.Contratos(cliente);
