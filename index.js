//
const express = require("express");
const { urlencoded } = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const upload = require("express-fileupload");
const cors = require("cors");
// const { v4: uuidv4 } = require("uuid");
const { Audio } = require("./Schema");

// Middleware
const app = express();
app.use(upload({ useTempFiles: true }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

const { cloudinary } = require("./cloudinary");

// parse application/json
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);
//
// parse application/json
app.use("/images", express.static("images"));
app.use("/audio", express.static("audio"));

// connecting db
let dbURL;
if (process.env.NODE_ENV === "production") {
  dbURL =
    "mongodb+srv://nuex:jCW5XBVxuGBd42es@cluster0.1vwqfr6.mongodb.net/test";
}
if (process.env.NODE_ENV !== "production") {
  dbURL = "mongodb://127.0.0.1:27017/MusicApp";
}

// initializing port
const PORT = process.env.PORT || 5000;

// connecting the db
mongoose
  .connect(dbURL)
  .then((result) => {
    app.listen(PORT);
    console.log("Connected Successfully");
  })
  .catch((err) => {
    console.log(err);
  });

// DOWNLOAD

app.get("/api/downloads/", async (req, res) => {
  const { fileName } = req.query;
  try {
    const file = __dirname + "/" + fileName;
    res.download(file);
  } catch (error) {
    console.log(error);
  }
});
// API
app.get("/api", async (req, res) => {
  try {
    const audio = await Audio.find().skip(0).limit(10).sort({ createdAt: -1 });
    res.json(audio);
  } catch (error) {}
  // res.status(200).send("gooten successfully");
});

/**
 * @Search
 */
app.get("/api/searchs", async (req, res) => {
  try {
    const { q } = req.query;
    // console.log(q);
    const audio = await Audio.find({
      $text: { $search: q },
      $text: { $search: q },
    });
    res.json(audio);
  } catch (error) {
    console.log(error);
  }
  // res.status(200).send("gooten successfully");
});

/**
 * @POST_AUDIO
 * Public
 */

app.post("/api", async (req, res) => {
  try {
    const { title, artist, description } = req.body;

    const audio = new Audio({
      title,
      artist,
      description,
    });
    await audio.save();

    // working for cover
    let cover;
    if (req.files.cover !== undefined) {
      const file = req.files.cover.tempFilePath;
      // console.log(file);
      const cover = await cloudinary.uploader.upload(file, {
        upload_preset: "Realestate",
      });
    } else {
      throw audio;
    }
    // const result = await cloudinary.uploader.upload(file, {
    //   upload_preset: "Realestate",
    // });
    // working for songs
    let filesDir = [];
    let type = "";
    if (req.files.songs !== undefined) {
      // console.log(req.files.songs);
      if (!req.files.songs.length) {
        type = "single";
        const file = req.files.songs.tempFilePath;
        // console.log(file);
        const result = await cloudinary.uploader.upload(file, {
          upload_preset: "Realestate",
        });
        filesDir.push(result.secure_url);
      } else {
        type = "abulm";
        await req.files.songs.forEach(async (file) => {
          const fileTemp = file.tempFilePath;
          const result = await cloudinary.uploader.upload(fileTemp, {
            upload_preset: "Realestate",
          });
          filesDir.push(result.secure_url);
          // CHECKING IF UPLOADING IS SUCCESSFULL
          if (filesDir.length == req.files.files.length) {
            await Audio.updateOne(
              { _id: audio._id },
              {
                $set: {
                  songs: filesDir,
                  type: type,
                },
              }
            );
          }
        });
        await req.files.songs.forEach(async (file) => {
          const fileName = file.name;
          dirPath = `audio/${fileName}`;
          filesDir.push(dirPath);
          const mvPath = "audio/" + fileName;
          await file.mv(mvPath, function (err) {});
        });
      }
    } else {
      throw audio;
    }
    // console.log(audio);

    // await Audio.updateOne(
    //   { _id: audio._id },
    //   {
    //     $set: {
    //       cover: cover,
    //       songs: filesDir,
    //       type: type,
    //     },
    //   }
    // );

    res.json({ success: "true" });
  } catch (error) {
    // console.log(error);
    if (error.message) {
      res.json({ err: "exists" });
    } else {
      Audio.findByIdAndDelete(error._id).then();
      res.json({ err: "error" });
    }
    // res.json(error);
  }
});

//
app.put("/api/like", async (req, res) => {
  Audio.findByIdAndUpdate(
    req.body.audioId,
    {
      $push: { likes: req.body.userId },
    },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(442).json({ error: err });
    } else {
      res.json(result);
    }
  });
});

//Unlike
app.put("/api/unLike", async (req, res) => {
  Audio.findByIdAndUpdate(
    req.body.audioId,
    {
      $pull: { likes: req.body.userId },
    },
    { new: true }
  ).exec((err, result) => {
    if (err) {
      return res.status(442).json({ error: err });
    } else {
      res.json(result);
    }
  });
});

// Get top charts

app.get("/api/charts/", async (req, res) => {
  try {
    const audio = await Audio.aggregate([
      {
        $addFields: {
          likesLength: {
            $size: "$likes",
          },
        },
      },
      { $sort: { likesLength: -1 } },
      { $limit: 3 },
    ]);
    res.json(audio);
  } catch (error) {
    res.json(error);
  }
});

/**
 * @GET_SINGLE_MUSIC
 */
app.get("/api/:id", async (req, res) => {
  const { id } = req.params;
  // console.log(id);
  try {
    const audio = await Audio.findById(id);
    res.json(audio);
  } catch (error) {}
  // res.status(200).send("gooten successfully");
});
