const bcrypt = require('bcrypt');
let { customers } = require('./customers');
let { quizzes } = require('./data');
let { flowers } = require('./flowers');
let { scores } = require('./scores');

let store = {
    addCustomer: (name, email, password) => {
        // check if this email is already in use
        let customer = customers.find(x => x.email.toLowerCase() === email.toLowerCase());
        if (!customer) {
            const hash = bcrypt.hashSync(password, 10);
            customers.push({ id: 1, name: name, email: email, password: hash })
            return { valid: true, message: 'Successfully registered.' }
        } else {
            return { valid: false, message: 'Email already in use.' }
        }
    },

    login: (email, password) => {
        let customer = customers.find(x => x.email.toLowerCase() === email.toLowerCase());
        if (customer) {
            let valid = bcrypt.compareSync(password, customer.password);
            if (valid) {
                return { valid: true };
            } else {
                return { valid: false, message: 'Credentials are not valid.' }
            }
        } else {
            return { valid: false, message: 'Email not found.' }
        }
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
        let isValidQuiz = quizzes.find(x => x.name === quizId);
        if(isValidCustomer && isValidQuiz) {
            let currentDate = new Date();
            scores.push({quizTaker: quizTaker, quizId: quizId, score: quizScore, date: currentDate.toJSON()});
            return {valid: true}
        } else if(!isValidCustomer) {
            return {valid: false, message: 'The given email does not match a customer in our records.'}
        } else {
            return {valid: false, message: 'The given quiz ID does not match a quiz in our records.'}
        }
    },

    getScore: (quizTaker, quizId) => {
        let score = scores.find(x => {x.quizTaker.toLowerCase() === quizTaker && x.quizId === quizId});
        if(score) {
            return {valid: true, result: score }
        } else {
            return {valid: false, message: 'Score not found.'}
        }
    }
}

module.exports = { store };