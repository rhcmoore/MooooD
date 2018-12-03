$(document).ready(function() {
    $("#results-callout").hide();
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyDwy1LRuWQzu_pS-4YIH8eVtBbrWERLy7w",
        authDomain: "my-project-f92de.firebaseapp.com",
        databaseURL: "https://my-project-f92de.firebaseio.com",
        projectId: "my-project-f92de",
        storageBucket: "my-project-f92de.appspot.com",
        messagingSenderId: "863552139342"
    };
    firebase.initializeApp(config);
    // =========== AUTHENTICATION ==============

    var database = firebase.database();
    var auth = firebase.auth();
    var userID;
    var email;
    var pass;
    var d = new Date();
    var journalDate = d.getTime();
    var journalArray = [];
    var journalStr = "string";

    // Thanks to Mike Heavers (@mheavers) for his Medium post on Firebase storage:
    // https://medium.com/@mheavers/setting-up-a-basic-file-upload-feature-for-your-static-website-with-just-javascript-using-firebase-32464580d8bb
    const storageService = firebase.storage();
    const storageRef = storageService.ref();

    //Login (on page)
    $(document).on("click", "#logIn", function() {
        event.preventDefault();
        email = $("#emailInput").val();
        pass = $("#passInput").val();
        var promise = auth.signInWithEmailAndPassword(email, pass);
        promise.catch(e => console.log(e.message));
    });

    //Signup (on page)
    $(document).on("click", "#signUp", function(){
        event.preventDefault();
        email = $("#emailInput").val();
        pass = $("#passInput").val();
        var promise = auth.createUserWithEmailAndPassword(email, pass);
        promise.catch(e => console.log(e.message));
        console.log("hi");
        //          function addUserToDatabase(userId, email)
    });

    //Logout (on page)
    $(document).on("click", "#logOut", function(event) {
        event.preventDefault();
        firebase.auth().signOut();
    });

    //Detects whether or not user has logged in
    auth.onAuthStateChanged(firebaseUser => {
        if (firebaseUser) {
            userID = firebaseUser.uid;
            email = firebaseUser.email;
            console.log("userID: " + userID);
        } else {
            //user signs out
        };
    });

    function getCurrentUserData(){
        var user = auth.currentUser;
        if (user != null) {
            email = user.email;
            userId = user.uid;
        }
    }

    function addUserToDatabase(userId, email) {
        firebase.database().ref('users/' + userId).set({
            email: email,
        });
    }


    // global variables for call to Face++
    var imageQueryURL;
    // Selecting uploaded file if user chooses to upload their own
    let selectedFile;
    function handleFileUploadChange(e) {
        selectedFile = e.target.files[0];
    };

    // function for Face++ call and DOM update
    function callFacePlusPlus() {
        console.log("Calling Face ++");
        console.log(imageQueryURL);
        // AJAX call to Face++ (image)
        $.ajax({
            url: imageQueryURL,
            method: "POST"
        }).then(function(response) {
            // log emotions from response
            console.log("Image results: ", response.faces[0].attributes.emotion);
            // Set variables from response
            var res = response.faces[0].attributes.emotion;
            var imageAnger = Number((res.anger).toFixed(2));
            var imageFear = Number((res.fear).toFixed(2));
            var imageJoy = Number((res.happiness).toFixed(2));
            var imageSadness = Number((res.sadness).toFixed(2));
            var imageSurprise = Number((res.surprise).toFixed(2));
            var imageDisgust = Number((res.disgust).toFixed(2));
            var imageNeutral = Number((res.neutral).toFixed(2));
            // Set data in Firebase
            database.ref("userData").child(userID).child(journalDate).update({
                imageLink : imageQueryURL.split("&image_url=")[1],
                imageAnger: imageAnger,
                imageFear: imageFear,
                imageJoy: imageJoy,
                imageSadness: imageSadness,
                imageSurprise: imageSurprise,
                imageDisgust: imageDisgust,
                imageNeutral: imageNeutral
            });
            // Update DOM
            $("#image-anger").text(imageAnger + "%");
            $("#image-fear").text(imageFear + "%");
            $("#image-joy").text(imageJoy + "%");
            $("#image-sadness").text(imageSadness + "%");
            $("#image-surprise").text(imageSurprise + "%");
            $("#image-disgust").text(imageDisgust + "%");
            $("#image-neutral").text(imageNeutral + "%");

            // Display chart section
            var base = 10;
            // create data for the image series
            var data_2 = [
                {x: "Anger", value: imageAnger + base},
                {x: "Fear", value: imageFear + base},
                {x: "Joy", value: imageJoy + base},
                {x: "Sadness", value: imageSadness + base},
                {x: "Surprise", value: imageSurprise + base},
            ];
            $("#imgChart").empty();
            // create and configure a pie chart
            var stage = anychart.graphics.create('container');
            var chart1 = anychart.pie(data_2);
            chart1.innerRadius("75%");

            // create a bar chart
            var chart2 = anychart.bar(data_2);

            // set bar chart as the center content of a pie chart
            chart1.center().content(chart2);
            // set the container id
            chart1.container("imgChart");

            // initiate drawing the chart
            chart1.draw();
        });
    };

    // =============== IMAGE Handling Function =============
    function handleFileUploadSubmit(e) {
        // .child creates a child directory (called images), and .put places the file inside this directory
        const uploadTask = storageRef.child(`images/${selectedFile.name}`).put(selectedFile);
        console.log("Image submitted to Firebase storage");

        uploadTask.on('state_changed', (snapshot) => {
            // Observe state change events such as progress, pause, and resume
        }, (error) => {
            // Handle unsuccessful uploads
            console.log(error);
        }, () => {
            console.log('Image uploaded successfully');
            // once upload is complete, pull the image URL
            uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                console.log(downloadURL);
                // Prep for Imgur
                var form = new FormData();
                form.append("image", downloadURL);
                var settings = {
                    "async": true,
                    "crossDomain": true,
                    "url": "https://api.imgur.com/3/image",
                    "method": "POST",
                    "headers": {
                        "Authorization": "Client-ID 93af746163a6448"
                    },
                    "processData": false,
                    "contentType": false,
                    "mimeType": "multipart/form-data",
                    "data": form
                }

                // AJAX call to Imgur (get a useable image link)
                $.ajax(settings).then(function (response) {
                    console.log(response);
                    var imgurImageLink = JSON.parse(response).data.link;
                    console.log(imgurImageLink);
                    // change global variable to workable image
                    imageQueryURL = "https://api-us.faceplusplus.com/facepp/v3/detect?api_key=PYtXrUAv_8smka-0NHt41JdBmZ1jdL01&api_secret=OBmaSYKR7URc3NiFQgkjWNpIYafOU_35&return_attributes=emotion&image_url=" + imgurImageLink;
                });
            });
        });
    };

    // =============== TEXT Handling Function =============
    function callIndico() {
        console.log("Calling Indico")
        // grab submitted text and image
        var journalPost = $("#text-submit").val();
        console.log("journalPost:   " + journalPost);
        // create query URLs
        var textQueryURL = "https://apiv2.indico.io/emotion/?api_key=d292aaf451b50aad46bd779bb711df7d&data=" + journalPost;

        // AJAX call to Indico (text)
        $.ajax({
            url: textQueryURL,
            method: "GET"
        }).then(function(response) {
            // log emotions from response
            console.log("Text results: ", response.results);
            // Set variables from response
            var textAnger = Number((response.results.anger * 100).toFixed(2));
            var textFear = Number((response.results.fear * 100).toFixed(2));
            var textJoy = Number((response.results.joy * 100).toFixed(2));
            var textSadness = Number((response.results.sadness * 100).toFixed(2));
            var textSurprise = Number((response.results.surprise * 100).toFixed(2));
            // Set data in Firebase
            database.ref("userData").child(userID).child(journalDate).update({
                entryDate : journalDate,
                journalPost : journalPost,
                textAnger: textAnger,
                textFear: textFear,
                textJoy: textJoy,
                textSadness: textSadness,
                textSurprise: textSurprise,
            });
            // Update DOM
            $("#text-anger").text(textAnger + "%");
            $("#text-fear").text(textFear + "%");
            $("#text-joy").text(textJoy + "%");
            $("#text-sadness").text(textSadness + "%");
            $("#text-surprise").text(textSurprise + "%");

            // Display chart section
            var base = 10;
            // create data for the text series
            var data_1 = [
                {x: "Anger", value: textAnger + base},
                {x: "Fear", value: textFear + base},
                {x: "Joy", value: textJoy + base},
                {x: "Sadness", value: textSadness + base},
                {x: "Surprise", value: textSurprise + base},
            ];
            $("#textChart").empty();
            var chart1 = anychart.pie(data_1);
            chart1.innerRadius("75%");

            // create a bar chart
            var chart2 = anychart.bar(data_1);

            // set bar chart as the center content of a pie chart
            chart1.center().content(chart2);
            // set the container id
            chart1.container("textChart");

            // initiate drawing the chart
            chart1.draw();
        });
    };
    // Handles file upload via the Choose File upload button.
    $('.file-select').on('change', handleFileUploadChange);

    // When user hits submit, make calls and update DOM
    $(".entry-area").submit(function(event) {
        // prevent refresh
        event.preventDefault();

        // Handling both link submission & local image select (link submission takes precedence for speed)
        if ($("#image-submit").val()) {
            // grab link from submitted link
            var submittedLink = $("#image-submit").val();
            console.log(submittedLink);
            // set image query URL to submitted link
            imageQueryURL = "https://api-us.faceplusplus.com/facepp/v3/detect?api_key=PYtXrUAv_8smka-0NHt41JdBmZ1jdL01&api_secret=OBmaSYKR7URc3NiFQgkjWNpIYafOU_35&return_attributes=emotion&image_url=" + submittedLink;
        } else {
            // set image query URL to imgur link (generated from user-submitted file)
            handleFileUploadSubmit(event);
        }
        $(".results").css("visibility", "hidden");
        $("#results-callout").show().css("background-image","url('img/proccessGiphy.gif')");
        // make call to Face++ and update DOM
        // We need to wait for imgur to process & upload the new image, setting the imageQueryURL variable
        setTimeout(function(){callFacePlusPlus()}, 6000);
        // make call to Indico and update DOM
        setTimeout(function(){callIndico()}, 6000);
        setTimeout(function(){ $(".results").css("visibility", "visible"); }, 6000);
        setTimeout(function(){ $("#results-callout").css("background-image","url('https://s22295.pcdn.co/wp-content/uploads/pitching2.jpg')") }, 6000);
        var user = firebase.auth().currentUser;

        if (user) {//write data to database
            database.ref().child("user/" + userID).set({
                email: email,
                pass: pass,
                journalDate: journalDate,
                journalArray: journalArray,
            });
        } else {
            // No user is signed in, thus do not push to database
        }

    });
    // When a child is added to the record
    database.ref().on("child_added", function(snapshot) {
        console.log("Child added");
        // get all user posts
        var userPost = snapshot.val()[userID];
        console.log(userPost);
        var userEntries = Object.keys(userPost);
        console.log(userEntries);
        // for each date-stamped post
        for (var i=0; i<userEntries.length; i++) {
            // get the emotion results
            var emotionResults = userPost[userEntries[i]];
            // dynamically create new 'card' with past journal entries
            var newDiv = $("<div>").addClass("col-lg-5 emotion-card").css("border", "1px solid grey").css("margin", "5px");
            var newDate = $("<p>").text(new Date(emotionResults.entryDate).toISOString().split("T")[0]).addClass("emotion-card-date");
            var newImage = $("<img>").attr("src", emotionResults.imageLink).css("width", "200px").css("float", "right").addClass("emotion-card-image");
            var newPost = $("<p>").text(emotionResults.journalPost).addClass("emotion-card-post");
            var newTextUL = $("<ul>").addClass("col-lg-6").addClass("emotion-card-text-results");
            var newtextAngerLI = $("<li>").text("Text Anger: " + emotionResults.textAnger);
            var newtextFearLI = $("<li>").text("Text Fear: " + emotionResults.textFear);
            var newtextJoyLI = $("<li>").text("Text Joy: " + emotionResults.textJoy);
            var newtextSadnessLI = $("<li>").text("Text Sadness: " + emotionResults.textSadness);
            var newtextSurpriseLI = $("<li>").text("Text Surprise: " + emotionResults.textSurprise);
            newTextUL.append(newtextAngerLI, newtextFearLI, newtextJoyLI, newtextSadnessLI, newtextSurpriseLI).addClass("col-lg-6").addClass("emotion-card-image-results");
            var newImageUL = $("<ul>").addClass("col-lg-6");
            var newimageAngerLI = $("<li>").text("Image Anger: " + emotionResults.imageAnger);
            var newimageFearLI = $("<li>").text("Image Fear: " + emotionResults.imageFear);
            var newimageJoyLI = $("<li>").text("Image Joy: " + emotionResults.imageJoy);
            var newimageSadnessLI = $("<li>").text("Image Sadness: " + emotionResults.imageSadness);
            var newimageSurpriseLI = $("<li>").text("Image Surprise: " + emotionResults.imageSurprise);
            var newimageDisgustLI = $("<li>").text("Image Disgust: " + emotionResults.imageDisgust);
            var newimageNeutralLI = $("<li>").text("Image Neutral: " + emotionResults.imageNeutral);
            newImageUL.append(newimageAngerLI, newimageFearLI, newimageJoyLI, newimageSadnessLI, newimageSurpriseLI, newimageDisgustLI, newimageNeutralLI).addClass("col-lg-6");
            newDiv.append(newDate, newImage, newPost, newTextUL, newImageUL);
            $("#journal-history").prepend(newDiv);
        };
    });
    // If user clicks anywhere outside of the modal, Modal will close

    var modal = document.getElementById('modal-wrapper');
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        };
    };

    particlesJS.load(`particles-js`, `particals.json`, function() {
    console.log(`callback - particles.js config loaded`);
    }); 

});