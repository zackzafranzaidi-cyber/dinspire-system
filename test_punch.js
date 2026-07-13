require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
    const { data } = await supabase.from('punch_cards').select('*, staff(username)').limit(2);
    console.log(JSON.stringify(data, null, 2));
}
test();
