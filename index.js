const express = require('express');
const bcrypt = require('bcrypt');
const { store } = require('./temp-store/store');
const app = express();
const port = 8000;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({done: true, message: 'Fine!'});
})

app.post('/register', (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    store.addCustomer(name, email, password);
    res.status(200).json({done: true, message: 'Customer added'});
})

app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let result = store.login(email, password);
    if(result.valid) {
        res.status(200).json({done: true, message: 'The customer logged in successfully'});
    } else {
        res.status(401).json({done: false, message: result.message})
    }
})

app.get('/quiz/:id', (req, res) => {
    let id = req.params.id;
    let result = store.getQuiz(id);
    if(result.done) {
        res.status(200).json({done: true, result: result.quiz});
    } else {
        res.status(404).json({done: false, message: result.message});
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})