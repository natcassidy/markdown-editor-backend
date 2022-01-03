require("dotenv").config()

const mysql = require('mysql')
const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
const jwt = require("jsonwebtoken")

app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true}))
// app.use(express.static(path.join(__dirname, "../frontend", )))

app.set('view engine', 'ejs')
app.set('views', 'frontend')

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

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    console.log('Authorizing in authtoken call, ', token)

    if(token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log('verifying token')
        if (err) return res.sendStatus(403)
        req.username = user
        console.log('user success: ', user)
        next()
    })
}

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/editor', authenticateToken, (req, res) => {
    res.render('editor')
})

app.post('/new-document', authenticateToken, (req, res) => {
    console.log('New document')
    con.query(`INSERT INTO document (user, title, content) VALUES ('${req.body.username}', '${req.body.title}', '${req.body.content}')`, (err, result) => {
        if (err) throw err
        console.log('record inserted')
    })
})

app.get('/documents', authenticateToken, (req, res) => {
    con.query('SELECT * FROM document ORDER BY ModificationDate DESC', (err, result, fields) => {
        res.send(result)
    })
})

app.put('/documents', authenticateToken, (req, res) => {
    con.query(`UPDATE document SET title = '${req.body.title}', content = '${req.body.content}' WHERE documentID = '${req.body.id}'`, (err, result) => {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
        res.send(result)
    })

    console.log('inside put')
})

app.get('/documents/:id', authenticateToken, (req, res) => {
    console.log('inside doc get for id', req.params.id)
    con.query(`SELECT * FROM document WHERE documentID = '${req.params.id}'`, (err, result, fields) => {
        console.log('resul ', result)
        res.send(result)
    })
})



app.listen(3001, () => {
    console.log('listening on port 3001')
})