import { createServer } from "https";
import { readFileSync } from "fs";
import next from "next";

const dev = true;
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: readFileSync("./certs/localhost+3-key.pem"),
  cert: readFileSync("./certs/localhost+3.pem"),
};

const port = 3443;

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`✅ HTTPS server running at https://localhost:${port}`);
  });
});
