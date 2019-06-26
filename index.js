/*jshint esversion: 8 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fetch = require('node-fetch');

require('dotenv').config();

const app = express();

app.use(morgan('tiny'));
app.use(cors());
app.use(function (req, res, next) { 
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type'); 
    next();
});

let cache;
const url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PLc9CV2DDbLKFB73vaV34E9uNQYPuXX4pJ&maxResults=50';
const getVideos = (pageToken) =>
    fetch(`${url}&key=${process.env.GOOGLE_API_KEY}`)
    .then(response => response.json());

app.get('*', async (req, res) => {
    if (cache) return res.json(cache);

    let page = await getVideos();
    let videos = page.items;

    while (page.nextPageToken) {
        page = await getVideos(page.nextPageToken);
        videos = videos.concat(page.items);
    }

    cache = videos;
    res.json(videos);
});

function notFound(req, res, next) {
    res.status(404);
    const error = new Error('Not Found');
    next(error);
}

function errorHandler(error, req, res, next) {
    res.status(res.statusCode || 500);
    res.json({
        message: error.message
    });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('Listening on port', port);
});


module.exports = app;
