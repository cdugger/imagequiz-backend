const express = require('express');
const cors = require('cors');
const { store } = require('./data_access/store');


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
    store.addCustomer(name, email, password)
    .then(x => {
        res.status(200).json({ done: true, message: 'Customer added' });
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({done: false, message: 'The customer was not added due to an error.'})
    });
});

app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    store.login(email, password)
    .then(x => {
        if(x.valid) {
            res.status(200).json({done: true, message: 'The customer logged in successfully!'});
        } else {
            res.status(401).json({done: false, message: x.message});
        }
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({done: false, message: 'Something went wrong.'})
    })
})

app.get('/flowers', (req, res) => {
    let result = store.getFlowers();
    if (result.done) {
        res.status(200).json({ done: true, message: 'Successfully retrieved flowers', result: result.flowers })
    } else {
        res.status(404).json({ done: false, message: result.message })
    }
})

app.get('/quiz/:name', (req, res) => {
    let name = req.params.name;
    store.getQuiz(name)
    .then(x => {
        if(x.id) {
            res.status(200).json({ done: true, result: x });
        } else {
            res.status(404).json({ done: false, message: result.message});
        }
    })
    .catch(e => {
        console.log(e);
        res.status(500).json({done: false, message: 'Something went wrong.'});
    });
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
        res.status(200).json({ done: true, result: result.score});
    } else {
        res.status(404).json({ done: false, message: result.message, result: undefined});
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})