import express from "express";
import cors from "cors";

const app = express();

const PORT = 3000;

app.use(cors({
    origin: "http://localhost:5173"
}));

app.get("/api/hello", (req, res) => {
    res.json({
        message: "Hello from Wiki API!"
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});