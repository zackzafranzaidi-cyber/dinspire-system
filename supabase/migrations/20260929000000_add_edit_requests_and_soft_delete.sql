-- Add is_active column to staff table for Soft Delete
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create edit_requests table
CREATE TABLE IF NOT EXISTS edit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_table TEXT NOT NULL, 
    transaction_id UUID NOT NULL, 
    staff_id UUID REFERENCES staff(id),
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    old_payment_method TEXT,
    new_payment_method TEXT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
