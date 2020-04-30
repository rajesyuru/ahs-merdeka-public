const express = require('express');

const routers = require('./routers');

const app = express();

app.use(routers);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Aplikasi jalan di port ${port}`);
})