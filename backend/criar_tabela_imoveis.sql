CREATE TABLE imoveis (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco NUMERIC,
    imagem VARCHAR(255),
    carrossel TEXT,
    quartos INTEGER,
    salas INTEGER,
    area NUMERIC,
    localizacao VARCHAR(255),
    tipo VARCHAR(100),
    banheiros INTEGER,
    codigo VARCHAR(50),
    visitas INTEGER DEFAULT 0
);
