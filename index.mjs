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

app.get('/', (req, res, next) => {
    res.send({ success: true })
});

app.get('/login', (req, res, next) => {
    res.render('login');
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
  
    next();
    }, (req, res, next) => {
    //Action
    res.send(req.body);
});

app.get('/product', async (req, res, next) => {
    let products
    try {
        products = await getProduct(db)
    } catch (error) {
        return next(error)
    }
    res.render('product', { products });
});

// POST Data + Foto/Gambar Menggunakan URL "/product"
app.post('/product', (req, res, next) => {
    console.log('Request', req.body);
    console.log('File', req.files);

    const schema = joi.object({
      name: joi.string().required(),
      price: joi.number().required(),
      photo: joi.any().optional()
    })
  
    const result = schema.validate(req.body)
    if (result.error) {
      return next(result.error);
    }

    next();
    }, (req, res, next) => {
        const filename = Date.now() + req.files.photo.name;
        fs. writeFile(path.resolve(__dirname + '/files/' + filename), req.files.photo.data, (err) => {
        if (err) {
            return next(err);
        }

        insertProduct(db, req.body.name, req.body.price, `/files/${filename}`);
        return res.redirect('/product');
    });
});

// Handle from GET
app.get('/add-product', (req, res, next) => {
    res.send(req.query);
});

// POST Data + Foto/Gambar Menggunakan URL "/add-product"
app.post('/add-product', (req, res, next) => {
    console.log('Request', req.body);
    console.log('File', req.files);
    const fileName = Date.now() + req.files.photo.name;
  
    fs.writeFile(path.join(__dirname, '/files/', fileName), req.files.photo.data, (err) => {
      if (err) {
        console.error(err);
        return
      }
  
      insertProduct(db, req.body.name, parseInt(req.body.price), `/files/${fileName}`)
      res.redirect('/product');
    });
  });

app.use((req, res, next) => {
    return next(new Error('404: Halaman Tidak Ditemukan'));
});
  
app.use((err, req, res, next) => {
    console.log(err.message);
    res.render('default-error', { errorMessage: err.message });
});
  
app.listen(process.env.PORT, () => {
    console.log(`App Listen On Port ${process.env.PORT}`);
});