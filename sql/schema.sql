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

-- Listado de servicios (pantalla principal / Kanban de casos).
-- Antes vivía en localStorage del navegador; ahora es compartido entre
-- computadoras. id es el string generado en el cliente (ej. "srv_1723...").
CREATE TABLE dbo.Servicios (
    id              NVARCHAR(50)   PRIMARY KEY,
    creado          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    vendedor        NVARCHAR(20)   NULL,
    nombre          NVARCHAR(200)  NOT NULL,
    tel             NVARCHAR(30)   NULL,
    origen          NVARCHAR(500)  NULL,
    destino         NVARCHAR(500)  NULL,
    fecha           NVARCHAR(20)   NULL,
    hora            NVARCHAR(20)   NULL,
    estatus         NVARCHAR(20)   NOT NULL DEFAULT 'cotizacion',
    cuota           NVARCHAR(50)   NULL,
    anticipo        NVARCHAR(50)   NULL,
    notas           NVARCHAR(MAX)  NULL,
    detalle         NVARCHAR(MAX)  NULL  -- JSON: [{"cantidad":"1","descripcion":"..."}]
);

CREATE INDEX IX_Servicios_estatus ON dbo.Servicios(estatus);
CREATE INDEX IX_Servicios_vendedor ON dbo.Servicios(vendedor);
