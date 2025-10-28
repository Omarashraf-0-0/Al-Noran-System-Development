import bcrypt from "bcryptjs";

const plain = "123456";
const hash = "$2b$10$CSxX5.1J4Vq93iDshVa51.0eszxyV7/C1F3MXtFLD9mi6kMJ1qQ1e";

const result = await bcrypt.compare(plain, hash);
console.log("Compare result:", result);
