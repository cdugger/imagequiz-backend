const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();
let { quizzes } = require('../temp-store/data');

const connectionString = `postgres://${process.env.DBUSERNAME}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.DATABASEPORT}/${process.env.DATABASE}`;
const connection = {
    connectionString: process.env.DATABASE_URL ? process.env.DATABASE_URL : connectionString,
    ssl: { rejectUnauthorized: false }
}
const pool = new Pool(connection);

let store = {
    addCustomer: (name, email, password) => {
        const hash = bcrypt.hashSync(password, 10);
        return pool.query('insert into imagequiz.customer (name, email, password) values ($1, $2, $3)', [name, email, hash]);
    },

    login: (email, password) => {
        return pool.query('select name, email, password from imagequiz.customer where email = $1', [email])
            .then(x => {
                if (x.rows.length == 1) {
                    let valid = bcrypt.compareSync(password, x.rows[0].password);
                    if (valid) {
                        return { valid: true };
                    } else {
                        return { valid: false, message: 'Credentials are not valid.' };
                    }
                } else {
                    return { valid: false, message: 'Email not found.' };
                }
            });
    },

    getFlowers: () => {
        return pool.query('select name, picture from imagequiz.flowers')
            .then(x => {
                let flowers = [];
                if (x.rows.length > 0) {
                    for (row of x.rows) {
                        let flower = {
                            name: row.name,
                            picture: row.picture
                        }
                        flowers.push(flower);
                    }
                }
                return flowers;
            })
    },

    getQuiz: (name) => {
        let sqlQuery = `select q.id as quiz_id, q2.* from imagequiz.quiz q join imagequiz.quiz_question qq on q.id = qq.quiz_id 
        join imagequiz.question q2 on qq.question_id = q2.id
        where lower(q.name) = $1`;
        return pool.query(sqlQuery, [name.toLowerCase()])
            .then(x => {
                // console.log(x);
                let quiz = {};
                if (x.rows.length > 0) {
                    quiz = {
                        id: x.rows[0].quiz_id,
                        questions: x.rows.map(y => {
                            return { id: y.id, pictures: y.picture, choices: y.choices, answer: y.answer };
                        })
                    };
                }
                return quiz;
            });
    },

    addScore: (quizTaker, quizId, quizScore) => {
        let customerQuery = `select id from imagequiz.customer where lower(customer.email) = $1`;
        let quizQuery = `select id from imagequiz.quiz where quiz.name = $1`;
        let scoreQuery = `insert into imagequiz.score (quiz_id, customer_id, score) values ($1, $2, $3)`;

        return pool.query(customerQuery, [quizTaker.toLowerCase()])
            .then(x => {
                if (x.rows.length > 0) {
                    let customerId = x.rows[0].id;
                    return pool.query(quizQuery, [quizId])
                        .then(y => {
                            if (y.rows.length > 0) {
                                let quizId = y.rows[0].id;
                                return pool.query(scoreQuery, [quizId, customerId, quizScore])
                                    .then(z => {
                                        return { valid: true };
                                    }).catch(err => {
                                        console.log(err);
                                        return { valid: false, message: 'Something went wrong' };

                                    })
                            } else {
                                return { valid: false, message: 'The given quiz ID does not match a quiz in our records.' };
                            }
                        })
                        .catch(err => {
                            console.log(err);
                            return { valid: false, message: 'Something went wrong.' }
                        })
                } else {
                    return { valid: false, message: 'The given email does not match a customer in our records.' };
                }
            })
    },

    getScore: (quizTaker, quizId) => {
        let score = scores.find(x => (x.quizTaker.toLowerCase() === quizTaker.toLowerCase()) && (x.quizId.toLowerCase() === quizId.toLowerCase()));
        if (score) {
            return { valid: true, score }
        } else {
            return { valid: false, message: 'Score not found.' }
        }
    }
}

module.exports = { store };