const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
// const cache = require("memory-cache");

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
const PORT = process.env.PORT || 3001;

const mongoURI =process.env.MongoDbUrl ||'';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define a MongoDB schema for rooms
const RoomSchema = new mongoose.Schema({
  room_id: { type: String, required: true, unique: true },
  content: { type: String, default: "" },
  last_modified: { type: Date, default: new Date() },
});

const RoomModel = mongoose.model("Room", RoomSchema);

// Updating the data of the room ---- Endpoint after finish typing in the textarea for the data
app.post("/api/updateroom", async (req, res) => {
  const { room_id, content } = req.body;
  try {
    let room = await RoomModel.findOne({ room_id });

    if (!room) {
      room = new RoomModel({ room_id, content, last_modified: new Date() });
    } else {
      room.content = content;
      room.last_modified = new Date();
    }

    await room.save();
    // Store data in cache for future requests with a TTL of 1 hour (3600 seconds)
    // cache.put(room_id, { status: "success", room }, 3600 * 1000);

    return res.json({ status: "success", room });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
});

// Create a new room if it doesn't exist or giving the data of the room if it exists -- Endpoint after finish typing in the room id input
app.post("/api/createroom", async (req, res) => {
  const { room_id } = req.body;
  try {
    // const cachedData = cache.get(room_id);
    // if (cachedData) {
    //   return res.json({ status: "success", ...cachedData.room });
    // }
    const existingRoom = await RoomModel.findOne({ room_id });

    if (existingRoom) {
      return res.json({ status: "already", data: existingRoom });
    }

    const newRoom = new RoomModel({ room_id });
    await newRoom.save();
    // Store data in cache for future requests with a TTL of 1 hour (3600 seconds)
    // cache.put(room_id, { status: "success", newRoom }, 3600 * 1000);

    return res.json({ status: "success", newRoom });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
