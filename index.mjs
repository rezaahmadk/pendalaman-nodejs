import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import hbs from 'hbs';
import path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import joi from 'joi';
import fileUpload from 'express-fileupload';
import fs from 'fs';

import { connectDB, initTable, insertProduct, getProduct, deleteProduct } from './database.js';
import { sendMailNotification } from './email.js';

const __dirname = path.resolve();

const app = express();
const db = connectDB();
initTable(db);

app.use(fileUpload());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/assets', express.static(path.join(__dirname, '/assets')));
app.use('/files', express.static(path.join(__dirname, '/files')));

app.set('views', path.join(__dirname, '/layouts'));
app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.get('/login', (req, res, next) => {
    res.render('login')
});

app.post('/login', (req, res, next) => {
    //Form Validation
    const schema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required()
    })
  
    const result = schema.validate(req.body);
    if(result.error) {
      return next(result.error);
    }
  
    next()
  }, (req, res, next) => {
    //Action
    res.send(req.body);
});

app.get('/product', async (req, res, next) => {
    const products = await getProduct(db);
    res.render('product', { products });
});

app.use((req, res, next) => {
    return next(new Error('404: Halaman Tidak Ditemukan'));
})
  
app.use((err, req, res, next) => {
    console.log(err.message);
    res.render('default-error', { errorMessage: err.message });
});
  
app.listen(process.env.PORT, () => {
    console.log('App Listen On Port 7000');
});