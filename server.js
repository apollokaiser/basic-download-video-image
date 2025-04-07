const express = require('express');
const cors = require('cors');
const routes = require('./src/router.js');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
const publicPath = path.join(process.cwd(), "public");
if (!fs.existsSync(publicPath)) {
    console.warn("⚠️  Không tìm thấy thư mục 'public/'. Hãy chắc chắn rằng thư mục này nằm cùng cấp với file .exe.");
}
app.use(express.static(publicPath));
// app.use(express.static(path.join(__dirname, "public")));

routes(app);
const PORT = 3000 
app.listen(PORT, async() => {
    console.log('Server chạy tại http://localhost:3000');
    const openPath = path.join(process.cwd(), "node_modules/open/index.js");
    const open = (await import(`file://${openPath}`)).default;
    await open(`http://localhost:${PORT}`)
});