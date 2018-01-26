'use strict';

// Dependencies
const gcloud = require('google-cloud', {
  projectId: 'sara-bigquery',
  keyfileName: 'keyfile.json'
});
const vision = gcloud.vision();
const fs = require('fs');
const async = require('async');


// Convert the newline delimited JSON file into JSON to send to our queue
let imageIds = [];
const data = fs.readFileSync('./image-ids.json').toString();
imageIds = data.split("\n").map(function(obj) {
  return JSON.parse(obj);
});

let imageData = [];
const features = [{
    "type": "FACE_DETECTION"
  },
  {
    "type": "LABEL_DETECTION"
  },
  {
    "type": "LANDMARK_DETECTION"
  },
  {
    "type": "WEB_DETECTION"
  },
  {
    "type": "IMAGE_PROPERTIES"
  }
];

// Call the Vision API with our GCS image URL
function callVision(task, callback) {
  console.log(`processing ${task.object_id}`);

  let visionReq = {
    "image": {
      "source": {
        "imageUri": `gs://gcs-storage-bucket/${task.id}.jpg`
      }
    },
    "features": features
  }

  vision.annotate(visionReq, function(err, annotations, resp) {
    if (err) {
      return callback(new Error(err));
    }

    let imgMetadata = annotations[0];

    if (!imgMetadata['imagePropertiesAnnotation']) {
      return callback(new Error('no data'));
    }

    imgMetadata['object_id'] = task.name;
    imageData.push(imgMetadata);
    return callback();
  });
}

// The queue sends the image ID to callVision() and writes the response to a local file
// once the entire queue has finished processing
let q = async.queue(callVision, 20);

q.push(imageIds, function(err) {
  if (err) {
    console.log(err)
  }
});

function done() {
  q.drain = null;
  fs.writeFileSync('./responses.json', JSON.stringify(imageData));
}

// Will only be executed when the queue is drained
q.drain = done;
