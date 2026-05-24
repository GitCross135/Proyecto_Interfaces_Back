CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    member_since VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    date VARCHAR(100),
    raw_date TIMESTAMP,
    time VARCHAR(20),
    venue VARCHAR(150),
    address VARCHAR(255),
    price INTEGER DEFAULT 0,
    price_label VARCHAR(10) DEFAULT 'paid',
    total_capacity INTEGER NOT NULL,
    sold_tickets INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id VARCHAR(10) REFERENCES events(code) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    used_at TIMESTAMP,
    qr_code_data_url TEXT,
    event_title TEXT,
    event_date TEXT,
    event_venue TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id VARCHAR(10) REFERENCES events(code) ON DELETE SET NULL,
    price INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT NOW()
);