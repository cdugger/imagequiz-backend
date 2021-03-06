const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

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

    findNonLocalCustomer: (email, provider) => {
        return pool.query('select * from imagequiz.customer where local = $1 and email = $2 and provider = $3', ['f', email, provider])
            .then(x => {
                if (x.rows.length == 1) {
                    return { found: true, user: { id: x.rows[0].id, username: x.rows[0].email, name: x.rows[0].name } };
                } else {
                    return { found: false };
                }
            })
    },
    findOrCreateNonLocalCustomer: async (name, email, password, provider) => {
        console.log('in findOrCreateNonLocalCustomer');
        console.log(name, email, password, provider);
        search = await store.findNonLocalCustomer(email, provider);
        if (search.found) {
            console.log('non local customer found');
            return search.user;
        }
        return pool.query('insert into imagequiz.customer (name, email, password, local, provider) values ($1 , $2, $3, $4, $5)', [name, email, password, 'f', provider])
            .then(x => {
                console.log('creating non local customer');
                return { done: true, user: { id: name, username: email, name: name } };
            });
    },
    login: (email, password) => {
        return pool.query('select id, name, email, password from imagequiz.customer where email = $1', [email])
            .then(x => {
                if (x.rows.length == 1) {
                    let valid = bcrypt.compareSync(password, x.rows[0].password);
                    if (valid) {
                        return { valid: true, user: { id: x.rows[0].id, username: x.rows[0].email } };
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

    getQuizzes: () => {
        return pool.query('select * from imagequiz.quiz')
            .then(x => {
                let quizzes = [];
                if (x.rows.length > 0) {
                    for (row of x.rows) {
                        let quiz = {
                            name: row.name,
                            category_id: row.category_id
                        }
                        quizzes.push(quiz);
                    }
                }
                return quizzes;
            })
    },
    getQuiz: (name) => {
        let sqlQuery = `select * from imagequiz.quiz_question qq join imagequiz.quiz q on qq.quiz_id = q.id
        join imagequiz.question q2 on qq.question_id = q2.id
        where lower(q.name) = $1`;
        return pool.query(sqlQuery, [name.toLowerCase()])
            .then(x => {
                let quiz = {};
                if (x.rows.length > 0) {
                    quiz = {
                        id: x.rows[0].quiz_id,
                        questions: x.rows.map(y => {

                            return { id: y.id, picture: y.picture, choices: y.choices.split(','), answer: y.answer };
                        })
                    };
                }
                return quiz;
            });
    },

    addScore: (quizTaker, quizId, quizScore) => {
        let customerQuery = `select id from imagequiz.customer where lower(customer.email) = $1`;
        let quizQuery = `select id from imagequiz.quiz where lower(quiz.name) = $1`;
        let scoreQuery = `insert into imagequiz.score (quiz_id, customer_id, score, date) values ($1, $2, $3, current_timestamp)`;
        if (!quizTaker || !quizId || !quizScore) {
            return { valid: false, message: "Something went wrong." };
        }
        return pool.query(customerQuery, [quizTaker.toLowerCase()])
            .then(x => {
                if (x.rows.length > 0) {
                    let customerId = x.rows[0].id;
                    return pool.query(quizQuery, [quizId.toLowerCase()])
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
        let scoreQuery = `select c.email, q.name, s.score from imagequiz.score s join imagequiz.quiz q on s.quiz_id = q.id join imagequiz.customer c on s.customer_id = c.id
        where lower(c.email) = $1 and lower(q.name) = $2`;
        console.log(scoreQuery);
        return pool.query(scoreQuery, [quizTaker.toLowerCase(), quizId])
            .then(x => {
                let scores = [];
                if (x.rows.length > 0) {
                    for (let row of x.rows) {
                        let score = {
                            quizTaker: row.email,
                            quizName: row.name,
                            score: row.score
                        }
                        scores.push(score);
                    }

                    return scores
                }
            })
    }
}

module.exports = { store };