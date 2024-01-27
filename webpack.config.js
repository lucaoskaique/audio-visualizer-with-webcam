import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "production",
  entry: ["./src/js/index.js"],
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "public"),
  },
};
