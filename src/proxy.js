const icy = require('icy');
const express = require('express');
const app = express();
const port = 3000;

/*

Running on OK on Node.js 22.11.0
Icy library used: https://www.npmjs.com/package/icy 

Stream sources for NRK: https://lyd.nrk.no/

*/

const CHANNELS = {
  super: {
    sourceUrl: "https://lyd.nrk.no/icecast/mp3/low/s0w7hwn47m/radio_super",
    apiUrl: "https://psapi.nrk.no/channels/radio_super/liveelements",
    name: "NRK Radio Super",
    passTrackInfo: false,
  },
  p1: {
    sourceUrl: "https://lyd.nrk.no/icecast/mp3/high/s0w7hwn47m/p1",
    apiUrl: "https://psapi.nrk.no/channels/p1_oslo_akershus/liveelements",
    name: "NRK P1",
    passTrackInfo: false,
  },
  mp3: {
    sourceUrl: "https://lyd.nrk.no/icecast/mp3/low/s0w7hwn47m/mp3",
    apiUrl: "https://psapi.nrk.no/channels/mp3/liveelements",
    name: "NRK MP3",
    passTrackInfo: false,
  },
  p3: {
    sourceUrl: "https://lyd.nrk.no/icecast/mp3/high/s0w7hwn47m/p3",
    apiUrl: "https://psapi.nrk.no/channels/p3/liveelements",
    name: "NRK P3",
    passTrackInfo: false,
  },
  p13: {
    sourceUrl: "https://lyd.nrk.no/icecast/mp3/high/s0w7hwn47m/p13",
    apiUrl: "https://psapi.nrk.no/channels/p13/liveelements",
    name: "NRK P13",
    passTrackInfo: false,
  },
};


const META_INTERVAL=4096;

// status endpoint on http://localhost:3000/status
app.use(require('express-status-monitor')());

// express server listen endpoint
app.get('/listen/:channel', (req, res) => {

  let channel = req.params.channel;

  let sourceUrl = CHANNELS[channel].sourceUrl;

  icy.get(sourceUrl, function (icyRes) {

    // log the HTTP response headers
    console.log(`Connected to ${sourceUrl}`);
    
    const icyWriter = icy.Writer(META_INTERVAL);
    
    // log any "metadata" events that happen
    icyRes.on('metadata', function (metadata) {
      var parsed = icy.parse(metadata);
      console.log("metadata in source stream: " + JSON.stringify(parsed));
      // if we have metadata in the stream, we can pass it on
      if (parsed.StreamTitle) {
        if (CHANNELS[channel].passTrackInfo) {
          icyWriter.queue(parsed.StreamTitle);
        }
      }
    });

    var headers = {
      "Content-Type": 'audio/mpeg',
      "icy-metaint" : META_INTERVAL,
      "icy-name" : CHANNELS[channel].name
    };
    res.writeHead(200, headers);

    // pipe mp3 stream
    icyRes.pipe(icyWriter).pipe(res);

    // update track title every 10 seconds
    var intervalId = setInterval(function() {
      getCurrentStreamInfo(channel, function(meta) { meta && icyWriter.queue(meta) })
    }, 10000);

    // stop interval timer when stream closes
    req.on("close", function() {
      console.log("Connection closed");
      clearInterval(intervalId);
    });

    icyRes.on('data', function(chunk) {
      //console.log("passing "+chunk.length+" bytes");
    });

  });



})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

function getCurrentStreamInfo(channel, callback) {
  let apiUrl = CHANNELS[channel].apiUrl;
  // This URL returns a list of tracks recently played and to be played in the near future.
  // We assume that it's sorted by time and select the last track marked as "Present" as the current track.
  // See https://psapi.nrk.no/documentation/ for some more information.
  
  fetch(apiUrl).then((response) => response.text()).then((body) => {
    if (!body) {
      console.log("Empty response from apiUrl");
      return;
    }
    var tracks = JSON.parse(body);
    var currentTrack = undefined;
    for(var i in tracks) {
      var track = tracks[i];
      if(track.relativeTimeType == "Present") {
        currentTrack = track;
      }
    }
    if (currentTrack) {
      console.log("Track info from "+apiUrl+" : "+JSON.stringify(currentTrack));
      var currentTrackText = formatStreamTitle(currentTrack.title, currentTrack.description);
      console.log("Formatted track description: "+currentTrackText);
      callback(currentTrackText);
    } else {
      console.log("No track info found in "+apiUrl)
    }
  }); 
}

let streamTitleFlip = true;
function formatStreamTitle(title, description) {
  if (!title && !description) {
    return "(no track info)";
  } else if (!title) {
    return description;
  } else if (!description) {
    return title;
  } else {
    streamTitleFlip = !streamTitleFlip;
    return (streamTitleFlip ? title+" – "+ description : description+" – "+ title);
  }
}

console.log("Starting server");



