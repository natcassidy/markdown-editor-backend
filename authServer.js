require("dotenv").config()

const mysql = require('mysql')
const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const cookieParser = require("cookie-parser")


app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true}))
app.use(cookieParser())

//Connect to db

const con = mysql.createConnection({
    host: "localhost",
    user: "nodejs",
    password: "Apps1234",
    database: "markdown"
})

con.connect(err => {
    if (err) throw err
    console.log('Connected!')

})

// Authentication

// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers["authorization"]
//     const token = authHeader && authHeader.split(" ")[1]
//     console.log('Authorizing in authtoken call, ', token)

//     if(token == null) return res.sendStatus(401)

//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//         console.log('verifying token')
//         if (err) return res.sendStatus(403)
//         req.username = user
//         console.log('user success: ', user)
//         next()
//     })
// }

app.post('/login', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    console.log('Username: ' + username + " password " + password)
    let userFromDB

    con.query(`SELECT * FROM USER WHERE username = '${username}'`, (err, result) => {
        if (err) return res.sendStatus(500)
        if (res == null) return res.sendStatus(403)
        userFromDB = result[0]
        console.log('user from db: ', userFromDB)

        bcrypt.compare(password, userFromDB.password).then(result => {
            console.log('results, ', result)
            console.log('userfromdb, ', userFromDB)

            if(result == true) {
                const accessToken = jwt.sign({ user: userFromDB.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h"})
                const refreshToken = jwt.sign({ user: userFromDB.username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "4h"})
                // const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
                // res.cookie('token', accessToken, {httpOnly: true})
                res.json({ accessToken: accessToken, refreshToken: refreshToken })
            } else {
                res.sendStatus(403)
            }
    
        }).catch(err => {
            console.log('error', err)
        })
    })
})

app.post('/refresh', (req, res) => {
    const token = req.body.token
    //not sure if user.username is valid here
    console.log('refresh: ', token)
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        console.log('user: ', user)
        const accessToken = jwt.sign({user: user.user }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h"})
        res.json({ accessToken: accessToken })
    })
})

app.post('/create-user', (req, res) => {
    const username = req.body.username
    const password = req.body.password

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).send(err)
        con.query(`INSERT INTO user VALUES ('${username}', '${hash}')`, (err, result) => {
            console.log('results from new user creation', result)
            const accessToken = jwt.sign(result[0].username, process.env.ACCESS_TOKEN_SECRET)
            // res.cookie('token', accessToken, {httpOnly: true})
            res.json({ accessToken: accessToken })
        })
    })
    //check if username already exists in db
})

// app.get('/login-try', authenticateToken, async (req, res) => {
//     res.status(200).send("Successfuly done!")
// })

app.listen(4000, () => {
    console.log('listening on port 4000')
})

