const express = require('express');
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const { store } = require('./data_access/store');
const backendURL = "https://cdugger-imagequiz-api.herokuapp.com";
let frontEndUrl = "https://cdugger.github.io/imagequiz";


const app = express();
const port = process.env.PORT || 4002;

app.use(express.json());
app.use(cors({
    origin: "https://cdugger.github.io",
    credentials: true
}));
passport.use(new LocalStrategy({ usernameField: 'email' }, function verify(username, password, cb) {
    store.login(username, password)
        .then(x => {
            if (x.valid) {
                return cb(null, x.user);
            } else {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }
        })
        .catch(err => {
            console.log(err);
            cb('Something went wrong');
        });
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${backendURL}/auth/google/callback`,
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        console.log('in Google strategy:');
        //console.log(profile);
        store.findOrCreateNonLocalCustomer(profile.displayName, profile.email, profile.id, profile.provider)
            .then(x => done(null, x))
            .catch(e => {
                console.log(e);
                return done('Something went wrong.');
            });

    }));



app.use((req, res, next) => {
    console.log(`request url: ${req.url}`);
    console.log(`request method: ${req.method}`);
    next();
})

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: 'sessions.db', dir: './sessions' })
}));

app.use(passport.authenticate('session'));

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

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
            res.status(500).json({ done: false, message: 'The customer was not added due to an error.' })
        });
});

app.post('/login-old', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    store.login(email, password)
        .then(x => {
            if (x.valid) {
                res.status(200).json({ done: true, message: 'The customer logged in successfully!' });
            } else {
                res.status(401).json({ done: false, message: x.message });
            }
        })
        .catch(e => {
            console.log(e);
            res.status(500).json({ done: false, message: 'Something went wrong.' });
        })
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/login/succeeded',
    failureRedirect: '/login/failed'
}));

app.get('/login/succeeded', (req, res) => {
    res.status(200).json({ done: true, message: 'The customer logged in successfully.' });
});

app.get('/login/failed', (req, res) => {
    res.status(500).json({ done: false, message: 'The credentials are invalid.' });
});

app.post('/logout', (req, res) => {
    req.logout();
    res.json({ done: true, message: 'The customer signed out successfully' })
});

app.get('/isloggedin', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json({ done: true, result: true });
    } else {
        res.status(410).json({ done: false, result: false });
    }

});

app.get('/auth/google',
    passport.authenticate('google', {
        scope:
            ['email', 'profile']
    })
)

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/auth/google/success',
        failureRedirect: '/auth/google/failure'
    })
);

app.get('/auth/google/success', (req, res) => {
    console.log('/auth/google/success');
    console.log(req.user);
    res.redirect(`${frontEndUrl}/#/google/${req.user.username}/${req.user.name}`);
});

app.get('/auth/google/failure', (req, res) => {
    console.log('/auth/google/failure');
    res.redirect(`${frontEndUrl}/#/google/failed`);
});


app.get('/flowers', (req, res) => {
    store.getFlowers()
        .then(x => {
            if (x) {
                res.status(200).json({ done: true, message: 'Successfully retrieved flowers', result: x, length: x.length })
            } else {
                res.status(404).json({ done: false, message: 'Unable to retrieve flowers' })
            }
        })
        .catch(e => {
            console.log(e);
            res.status(500).json({ done: false, message: 'Something went wrong.' });
        })
});

app.get('/quizzes', (req, res) => {
    store.getQuizzes()
        .then(x => {
            if (x) {
                res.status(200).json({ done: true, message: 'Successfully retrieved quizzes', result: x, length: x.length })
            } else {
                res.status(404).json({ done: false, message: 'Unable to retrieve quizzes' })
            }
        })
        .catch(e => {
            console.log(e);
            res.status(500).json({ done: false, message: 'Something went wrong.' });
        })
})

app.get('/quiz/:name', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ done: false, message: 'Please log in first.' });
    }
    let name = req.params.name;
    store.getQuiz(name)
        .then(x => {
            if (x.id) {
                res.status(200).json({ done: true, result: x });
            } else {
                res.status(404).json({ done: false, message: 'Unable to retrieve quiz' });
            }
        })
        .catch(e => {
            console.log(e);
            res.status(500).json({ done: false, message: 'Something went wrong.' });
        });
});

app.post('/score', (req, res) => {
    let quizTaker = req.body.quizTaker;
    let quizName = req.body.quizName;
    let score = req.body.score;
    store.addScore(quizTaker, quizName, score)
        .then(x => {
            if (x.valid) {
                res.status(200).json({ done: true, message: 'Quiz score successfully added.' });
            } else {
                res.status(401).json({ done: false, message: x.message });
            }
        })
        .catch(e => {
            console.log(e);
            res.status(500).json({ done: false, message: 'Something went wrong' });
        })
});

app.get('/scores/:quiztaker/:quizid', (req, res) => {
    let quizTaker = req.params.quiztaker;
    let quizId = req.params.quizid;
    store.getScore(quizTaker, quizId)
        .then(x => {
            if (x) {
                res.status(200).json({ done: true, result: x, length: x.length });
            } else {
                res.status(404).json({ done: false, message: "Unable to retrieve scores." });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ done: false, message: "Something went wrong." });
        })
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})