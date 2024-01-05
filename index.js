const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL);

const UserSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model("User", UserSchema);
const ExerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ExerciseSchema);
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.post("/api/users", async (req, res) => {
  console.log(req.body);

  const userObj = new User({
    username: req.body.username,
  });
  try {
    const user = await userObj.save();
    console.log(user);
    res.json(user);
  } catch (error) {
    console.log(error);
  }
});
app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const id = req.params._id;

  try {
    const user = await User.findById(id);
    if (!user) {
      res.send("cant find user");
    } else {
      const exerciseObj = await new Exercise({
        description,
        duration,
        date: date ? new Date(date) : new Date(),
        user_id: user._id,
      });
      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }
  } catch (error) {
    console.log(error);
    res.send("error");
  }
});
app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    res.send("Could not find user");
    return;
  }
  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id,
  };
  if (from || to) {
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500);

  const log = exercises.map((e) => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString(),
  }));

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log,
  });
});
app.get("/api/users", async (req, res) => {
  let u = await User.find().select("_id username");
  if (!u) {
    res.send("no");
  } else {
    res.json(u);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
