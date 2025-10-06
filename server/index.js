import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import webhook from './routes/webhook.js';
const app = express();
app.use(bodyParser.json());
app.use('/webhook', webhook);
app.get('/health', (_req,res)=>res.json({ok:true}));
app.listen(process.env.PORT||8080, ()=>console.log('API up'));