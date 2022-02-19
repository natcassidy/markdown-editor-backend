require("dotenv").config()

const mysql = require('mysql')
const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const { Client } = require('pg');
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true}))
app.use(cookieParser())
// app.use(express.static(path.join(__dirname, "../frontend", )))

app.set('view engine', 'ejs')
app.set('views', 'frontend')

const con = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
con.connect();


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    // const token = req.cookies.token
    console.log('Authorizing in authtoken call, ', token)

    if(token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log('verifying token')
        if (err) return res.send(err)
        req.username = user.user
        console.log('user success: ', user)
        next()
    })
}

app.post('/new-document', authenticateToken, (req, res) => {
    console.log('New document')
    con.query(`INSERT INTO document (username, title, content) VALUES ('${req.username}', '${req.body.title}', '${req.body.content}') RETURNING *`, (err, result) => {
        if (err) throw err
        console.log('record inserted\n\n')
        console.log('result from insertion: ', result)
        res.send(result)
    })
})

app.route('/documents')
    .get(authenticateToken, (req, res) => {
        console.log('Quering documents, this is user: ', req.username)
        con.query(`SELECT * FROM document WHERE username = '${req.username}' ORDER BY ModificationDate DESC`, (err, result, fields) => {
            console.log('result ', result)
            res.send(result.rows)
        })
    })
    .put(authenticateToken, (req, res) => {
        con.query(`UPDATE document SET title = '${req.body.title}', content = '${req.body.content}' WHERE documentID = '${req.body.id}'`, (err, result) => {
            if (err) throw err;
            console.log(result.affectedRows + " record(s) updated");
            console.log('here is the result: ', result)
            res.send(result)
        })
    })

app.route('/documents/:id')
    .get(authenticateToken, (req, res) => {
        console.log('inside doc get for id', req.params.id)
        con.query(`SELECT * FROM document WHERE documentID = '${req.params.id}'`, (err, result, fields) => {
            console.log('result ', result)
            res.send(result.rows[0])
        })
    })
    .delete(authenticateToken, (req, res) => {
        console.log('inside doc get for delete', req.params.id)
        con.query(`DELETE FROM document WHERE documentID = '${req.params.id}'`, (err, result) => {
            if (err) throw err
            console.log("Number of records deleted: " + result)
            res.send(result)
        })
    })


app.route("/settings")
    .get(authenticateToken, (req, res) => {
        con.query(`SELECT * FROM settings WHERE username = '${req.username}'`, (err, result) => {
            if(err) res.send(err)
            res.send(result.rows[0])
        })
    })
    .put(authenticateToken, (req, res) => {
        con.query(`UPDATE settings
            SET xlargeSize = '${req.body.xlargeSize}',
            largeSize = '${req.body.largeSize}',
            medium = '${req.body.medium}',
            blockquote = '${req.body.blockquote}',
            bold = '${req.body.bold}',
            italic = '${req.body.italic}'
            WHERE username = '${req.username}'
            RETURNING *`, (err, result) => {
            if(err) res.send(err)
            res.send(result)
        })
    })

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})