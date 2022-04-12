const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString =  `postgres://${process.env.DBUSERNAME}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`;
const connection = {
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: { rejectUnauthorized: false}
}
const pool = new Pool(connection);

let store = {
    addCustomer: (name, email, password) => {
        const hash = bcrypt.hashSync(password, 10);
        return pool.query('insert into imagequiz.customer (name, email, password) values ($1,$2,$3)', [name, email, hash]);
    },

    login: (email, password) => {
        pool.query('select name, email, password from imagequiz.customer where email = $1', [email])
        .then(x => {
            if(x.rows.length == 1) {
                let valid = bcrypt.compareSync(password, x.rows[0].password);
                if (valid) {
                    return { valid: true };
                } else {
                    return { valid: false, message: 'Credentials are not valid.' };
                }
            } else {
                return {valid: false, message: 'Email not found.'};
            }
            
        });
    },

    getFlowers: () => {
        let flower_list = flowers;
        if (flower_list) {
            return { done: true, flowers };
        } else {
            return { done: false, message: 'Error retrieving flowers.' };
        }
    },

    getQuiz: (id) => {
        let quiz = quizzes.find(x => x.name.toLowerCase() === id.toLowerCase());
        if (quiz) {
            return { done: true, quiz };
        } else {
            return { done: false, message: 'A quiz with the name was not found.' };
        }
    },

    addScore: (quizTaker, quizId, quizScore) => {
        let isValidCustomer = customers.find(x => x.email.toLowerCase() === quizTaker.toLowerCase());
        let isValidQuiz = quizzes.find(x => x.name.toLowerCase() === quizId.toLowerCase());
        if (isValidCustomer && isValidQuiz) {
            let currentDate = new Date();
            scores.push({ quizTaker: quizTaker, quizId: quizId, score: quizScore, date: currentDate.toJSON() });
            return { valid: true }
        } else if (!isValidCustomer) {
            return { valid: false, message: 'The given email does not match a customer in our records.' }
        } else {
            return { valid: false, message: 'The given quiz ID does not match a quiz in our records.' }
        }
    },

    getScore: (quizTaker, quizId) => {
        let score = scores.find(x =>(x.quizTaker.toLowerCase() === quizTaker.toLowerCase()) && (x.quizId.toLowerCase() === quizId.toLowerCase()));
        if (score) {
            return { valid: true, score }
        } else {
            return { valid: false, message: 'Score not found.' }
        }
    }
}

module.exports = { store };