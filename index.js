import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3001;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "", 
    password: "", 
    port: 5432
});

let quiz = [
    { country: "France", capital: "Paris" },
    { country: "United Kingdom", capital: "London" },
    { country: "United States of America", "capital": "Washington D.C." }, 
    { country: "Germany", capital: "Berlin" },
];

let totalCorrect = 0;
let currentQuestion = {};

db.connect()
    .then(() => {
        console.log("Database connected successfully. Attempting to load quiz data...");

        db.query("SELECT country, capital FROM capitals")
            .then(res => {
                if (res.rows.length > 0) {
                    quiz = res.rows;
                    console.log(`Loaded ${quiz.length} questions from the database.`);
                } else {
                    console.log("Database query returned 0 rows. Using fallback quiz data.");
                }
            })
            .catch(err => {
                console.error("Error loading data from 'capitals' table:", err.stack);
                console.log("Using fallback quiz data due to database query error.");
            })
            .finally(() => {
                app.listen(port, () => {
                    console.log(`Server is running at http://localhost:${port}`);
                });
            });
    })
    .catch(err => {
        console.error("Error connecting to database. Using fallback quiz data.", err.stack);
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    });


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


function nextQuestion() {
    if (quiz.length === 0) {
        currentQuestion = { country: "Error", capital: "No questions loaded" };
        console.error("Quiz array is empty. Please check your database setup.");
        return;
    }
    const randomIndex = Math.floor(Math.random() * quiz.length);
    currentQuestion = quiz[randomIndex];
}

app.get("/", (req, res) => {
    totalCorrect = 0;
    nextQuestion(); 
    console.log(`New Game Started. Current question: ${currentQuestion.country}`);
    res.render("index.ejs", { question: currentQuestion, totalScore: totalCorrect, wasCorrect: null });
});

app.post("/submit", (req, res) => {
    if (!currentQuestion || typeof currentQuestion.capital !== 'string') {
        console.error("State Error: currentQuestion is invalid or missing 'capital' property.");
        return res.redirect("/"); 
    }

    let answer = req.body.answer ? req.body.answer.trim() : "";
    let isCorrect = false;

    if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
        totalCorrect++;
        isCorrect = true;
    }

    nextQuestion(); 

    res.render("index.ejs", {
        question: currentQuestion,
        wasCorrect: isCorrect,
        totalScore: totalCorrect,
    });
});
