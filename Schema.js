const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uniqueValidator = require("mongoose-unique-validator");
// const fs = require("fs");

// USER SCHEMA

const audioSchema = new Schema(
  {
    title: {
      type: String,
      unique: true,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    cover: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    songs: {
      type: Array,
      default: [],
    },
    description: {
      type: String,
      required: true,
    },
    likes: [{ type: String, required: true }],
  },
  { timestamps: true }
);

// Unique validation
audioSchema.plugin(uniqueValidator, {
  message: "{PATH} has already been taken",
});

// indexing
audioSchema.index({ title: "text", artist: "text" });

//model
const Audio = mongoose.model("audio", audioSchema);

// Creating indexs
Audio.createIndexes();

module.exports = { Audio };
