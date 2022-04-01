const express = require('express');
const cors = require('cors');
const { store } = require('./temp-store/store');


const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.status(200).json({ done: true, message: 'Hello world from the backend API' });
})

app.post('/register', (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let result = store.addCustomer(name, email, password);
    if (result.valid) {
        res.status(200).json({ done: true, message: 'Customer added' });
    } else {
        res.status(403).json({ done: false, message: result.message });
    }
})

app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let result = store.login(email, password);
    if (result.valid) {
        res.status(200).json({ done: true, message: 'The customer logged in successfully' });
    } else {
        res.status(401).json({ done: false, message: result.message });
    }
})

app.get('/flowers', (req, res) => {
    let result = store.getFlowers();
    if (result.done) {
        res.status(200).json({ done: true, message: 'Successfully retrieved flowers', result: result.flowers })
    } else {
        res.status(404).json({ done: false, message: result.message })
    }
})

app.get('/quiz/:id', (req, res) => {
    let id = req.params.id;
    let result = store.getQuiz(id);
    if (result.done) {
        res.status(200).json({ done: true, result: result.quiz });
    } else {
        res.status(404).json({ done: false, message: result.message, result: undefined });
    }
});

app.post('/score', (req, res) => {
    let quizTaker = req.body.quizTaker;
    let quizName = req.body.quizName;
    let score = req.body.score;
    let result = store.addScore(quizTaker, quizName, score);
    if (result.valid) {
        res.status(200).json({ done: true, message: 'Quiz score successfully added.' });
    } else {
        res.status(401).json({ done: false, message: result.message });
    }
})

app.get('/scores/:quiztaker/:quizid', (req, res) => {
    let quizTaker = req.params.quiztaker;
    let quizId = req.params.quizid;
    let result = store.getScore(quizTaker, quizId);
    if (result.valid) {
        res.status(200).json({ done: true, result: result.score.score });
    } else {
        res.status(404).json({ done: false, message: result.message, result: undefined});
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})