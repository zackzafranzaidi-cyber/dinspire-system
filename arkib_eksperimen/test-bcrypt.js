const bcrypt = require('bcryptjs');

async function test() {
  const password = "password123";
  const hash1 = await bcrypt.hash(password, 10);
  console.log("Hash 1:", hash1);
  const isValid1 = await bcrypt.compare(password, hash1);
  console.log("Is Valid 1?", isValid1);
  
  const hashFromDB = "$2b$10$3VWTeSYTbWiMh4p8IS.81eLsNYO4aO3nVK49oj7Gf8tMGlDqniHgS";
  const isValid2 = await bcrypt.compare(password, hashFromDB);
  console.log("Is Valid 2?", isValid2);
}
test();
