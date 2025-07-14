-- Tabla para documentos electrónicos del SRI
CREATE TABLE IF NOT EXISTS electronic_documents (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    access_key VARCHAR(49) NOT NULL UNIQUE,
    xml_content TEXT NOT NULL,
    sri_response JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    authorization_number VARCHAR(50),
    authorization_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para documentos electrónicos
CREATE INDEX IF NOT EXISTS idx_electronic_documents_invoice_id ON electronic_documents(invoice_id);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_access_key ON electronic_documents(access_key);
CREATE INDEX IF NOT EXISTS idx_electronic_documents_status ON electronic_documents(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_electronic_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_electronic_documents_updated_at
    BEFORE UPDATE ON electronic_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_electronic_documents_updated_at(); 