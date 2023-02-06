require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({ 
    cloud_name: 'dtjl9nigz', 
    api_key: '495218113372726', 
    api_secret: 's6sQIS8WoBT2rjm9dUjQ_nqZb9U' 
  });

  module.exports = {cloudinary};