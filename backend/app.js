import express from 'express';
import cors from "cors";

import cashierRoutes from './routes/cashierRoutes.js';

let corsOptions = {
    origin:"http://localhost:5173"
};

//create express app
const app = express();

app.use(express.json());
app.use(cors(corsOptions));

app.use('/cashier', cashierRoutes);

try {
    const port = 3000;
    app.listen(port, () => {
        console.log(`listening to port ${port}...`);
    });
} catch (e) {
    console.log(e);
}

