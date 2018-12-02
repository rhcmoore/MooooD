$(document).ready(function() {
    $("#results-callout").hide();
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyDoUt2cvuKUgc1xp5nGvCbvP3aVWfrlvNI",
        authDomain: "mood-2414d.firebaseapp.com",
        databaseURL: "https://mood-2414d.firebaseio.com",
        projectId: "mood-2414d",
        storageBucket: "mood-2414d.appspot.com",
        messagingSenderId: "674088000857"
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
        var auth = firebase.auth();
        var promise = auth.signInWithEmailAndPassword(email, pass);
        promise.catch(e => console.log(e.message));
    });

    //Signup (on page)
    $(document).on("click", "#signUp", function() {
        event.preventDefault();
        email = $("#emailInput").val();
        pass = $("#passInput").val();
        var auth = firebase.auth();
        var promise = auth.createUserWithEmailAndPassword(email, pass);
        promise.catch(e => console.log(e.message));
    });

    //Logout (on page)
    $(document).on("click", "#logOut", function(event) {
        event.preventDefault();
        firebase.auth().signOut();
    });

    //Detects whether or not user has logged in
    auth.onAuthStateChanged(firebaseUser => {
        if (firebaseUser) {
            userID = firebaseUser.uid
            console.log("userID: " + userID);
            database.ref().child("user/" + userID).set({
                email: email,
                pass: pass,
                journalDate: journalDate,
                journalArray:journalArray,
            });
        } else {
            
        };
    });

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
            database.ref("user").child(userID).child(journalDate).update({
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
            chart = anychart.radar()
            var series1 = chart.area(data_2);
            chart.container("imgChart");
            chart.draw();
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
            database.ref("user").child(userID).child(journalDate).update({
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
            chart = anychart.radar()
            var series1 = chart.area(data_1);
            chart.container("textChart");
            chart.draw();
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
        $("#results-callout").show().css("background-image","url('https://media1.tenor.com/images/918f9c0214da68656905b1be5c052300/tenor.gif')");
        // make call to Face++ and update DOM
        // We need to wait for imgur to process & upload the new image, setting the imageQueryURL variable
        setTimeout(function(){callFacePlusPlus()}, 6000);
        // make call to Indico and update DOM
        setTimeout(function(){callIndico()}, 6000);
        setTimeout(function(){ $(".results").css("visibility", "visible"); }, 6000);
        setTimeout(function(){ $("#results-callout").css("background-image","url('https://s22295.pcdn.co/wp-content/uploads/pitching2.jpg')") }, 6000);

    });
    // When a child is added to the record
    database.ref(userID).on("child_added", function(snapshot) {
        console.log("Child added");
        // get all user posts
        var userPost = snapshot.val()[userID];
        console.log(userPost);
        var userEntries = Object.keys(userPost);
        console.log(userEntries);
        // for each date-stamped post
        for (var i=0; i<userEntries.length - 2; i++) {
            // get the emotion results
            var emotionResults = userPost[userEntries[i]];
            console.log(emotionResults.textAnger);
            // dynamically create new 'card' with past journal entries
            var newDiv = $("<div>").addClass("col-lg-5").css("border", "1px solid grey").css("margin", "5px");
            // var newImage = $("<img>").attr("src", {SOMETHING});
            // var newPost = $("<p>").text({SOMETHING});
            var newTextUL = $("<ul>").addClass("col-lg-6");
            var newtextAngerLI = $("<li>").text("Text Anger: " + emotionResults.textAnger);
            var newtextFearLI = $("<li>").text("Text Fear: " + emotionResults.textFear);
            var newtextJoyLI = $("<li>").text("Text Joy: " + emotionResults.textJoy);
            var newtextSadnessLI = $("<li>").text("Text Sadness: " + emotionResults.textSadness);
            var newtextSurpriseLI = $("<li>").text("Text Surprise: " + emotionResults.textSurprise);
            newTextUL.append(newtextAngerLI, newtextFearLI, newtextJoyLI, newtextSadnessLI, newtextSurpriseLI);
            var newImageUL = $("<ul>").addClass("col-lg-6");
            var newimageAngerLI = $("<li>").text("Image Anger: " + emotionResults.imageAnger);
            var newimageFearLI = $("<li>").text("Image Fear: " + emotionResults.imageFear);
            var newimageJoyLI = $("<li>").text("Image Joy: " + emotionResults.imageJoy);
            var newimageSadnessLI = $("<li>").text("Image Sadness: " + emotionResults.imageSadness);
            var newimageSurpriseLI = $("<li>").text("Image Surprise: " + emotionResults.imageSurprise);
            var newimageDisgustLI = $("<li>").text("Image Disgust: " + emotionResults.imageDisgust);
            var newimageNeutralLI = $("<li>").text("Image Neutral: " + emotionResults.imageNeutral);
            newImageUL.append(newimageAngerLI, newimageFearLI, newimageJoyLI, newimageSadnessLI, newimageSurpriseLI, newimageDisgustLI, newimageNeutralLI);
            newDiv.append(newTextUL, newImageUL);
            $("#journal-history").append(newDiv);
        };
    });
    
});

