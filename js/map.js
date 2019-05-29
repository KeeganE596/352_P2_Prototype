function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(initializeMap);
  }
}

var map;
// Reference database markers collection
var databaseRef;
var selected;

function initializeMap(position) {
  // Get current position
  var latVar = position.coords.latitude;
  var lonVar = position.coords.longitude;
  var myLatLng = {lat: latVar, lng: lonVar};

  // Initialize map options
  var mapOptions = {
    center: myLatLng,
    zoom: 14,
    disableDefaultUI: true,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [ {"visibility": "off"} ]
      }, {
        featureType: "poi.park",
        elementType: "labels",
        stylers: [ {"visibility": "on"} ]
      }, {
        featureType: "road.highway",
        elementType: "labels.icon",
        stylers: [ {"visibility": "off"} ],
      }, {
        featureType: "transit.station.bus",
        elementType: "labels",
        stylers: [ {"visibility": "off"} ]
      }, {
        featureType: "transit.station.rail",
        elementType: "labels",
        stylers: [ {"visibility": "off"} ]
      }
    ]
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  initializeFirebase();
  getPlaces(latVar, lonVar);
}

function getPlaces(lat, lng) {
  axios.get('https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
    params:{
      location: lat + "," + lng,
      radius: '5000',
      type: 'park',
      key: 'AIzaSyCCv1Dspw7_tmd_7VA1T1tZYl2ayF-isfE'
    }
  })
  .then(function(response){
    // Send fetched response data to create markers
    createMarkers(response.data);
  })
  .catch(function(error){
    console.log(error);
  });
}

function createMarkers(data) {
  for (var i = 0; i < data.results.length; i++) {
    var marker = new google.maps.Marker({
      position: data.results[i].geometry.location,
      map: map,
      icon: 'images/markerTest.png',
      title: data.results[i].place_id
    });

    var databaseRef = firebase.database().ref('markers');
    var doesnotExist = false;

      databaseRef.child(data.results[i].place_id).once('value', snapshot => {
        if(snapshot.exists()){
          console.log("exists");
          
        } 
        else{
          console.log("doesnt exist");
          doesnotExist = true;
          console.log(doesnotExist);
        }
      });

      if(doesnotExist = true) {
        console.log("adding");
        var newdatabaseRef = databaseRef.child(data.results[i].place_id);
          newdatabaseRef.set({
            name: data.results[i].name,
            location: data.results[i].geometry.location,
            vicinity: data.results[i].vicinity
          });
      }

    addMarkerListener(marker);
  }
}

var addMarkerListener = function(marker) {
  google.maps.event.addListener(marker, 'click', function() {
    selected = marker;
    checkDatabase(marker);
    // Listen to form submit
    document.getElementById('userForm').addEventListener('submit', submitForm);
    document.getElementById('dogForm').addEventListener('submit', submitForm);
  });
}

function initializeFirebase() {
  var config = {
      apiKey: "[API_KEY]",
      authDomain: "mddn-352-project-2.firebaseapp.com",
      databaseURL: "https://mddn-352-project-2.firebaseio.com",
      projectId: "mddn-352-project-2",
      storageBucket: "mddn-352-project-2.appspot.com",
      messagingSenderId: "370371732462"
  };
  firebase.initializeApp(config);
  databaseRef = firebase.database().ref('markers');
  selected = null;
}

//Find marker data in the database
function checkDatabase(marker) {
  var newRef = databaseRef.child(marker.title);

  newRef.child("name").once('value').then(function(snapshot) {
    document.getElementById("printName").innerText = snapshot.val();
  });
  newRef.child("vicinity").once('value').then(function(snapshot) {
    document.getElementById("printAddy").innerText = snapshot.val();
  });
  newRef.child("location").child("lat").once('value').then(function(snapshot) {
    document.getElementById("printLocLat").innerText = ("lat: " + snapshot.val() + ", ");
  });
  newRef.child("location").child("lng").once('value').then(function(snapshot) {
    document.getElementById("printLocLng").innerText = ("lng: " + snapshot.val());
  });
  return newRef.child("dog-friendly").once('value').then(function(snapshot) {
    document.getElementById("printDog").innerText = ("Is Dog Friendly: " + snapshot.val());
  });
}

// Catch form submit
function submitForm(e) {
  e.preventDefault();

  // Get values
  var name = getInputVal('name');
  if(name != "") {
    updateName(name);
  }
  var toggle = getInputVal('dogFriendly');
  if(toggle != "" && (toggle == "yes" || toggle == "no")) {
    addDogFriendly(toggle);
  }
  
}

// Function to get form values
function getInputVal(id) {
  return document.getElementById(id).value;
}

// Save form values to database
function updateName(name) {
  var change = {};
  change["/name"] = name;
  return databaseRef.child(selected.title).update(change);
}

// Save form values to database
function addDogFriendly(toggle) {
  var change = {};
  change["/dog-friendly"] = toggle;
  return databaseRef.child(selected.title).update(change);
}
