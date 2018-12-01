

        $(document).ready(function() {
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

            // Thanks to Mike Heavers (@mheavers) for his Medium post:
            // https://medium.com/@mheavers/setting-up-a-basic-file-upload-feature-for-your-static-website-with-just-javascript-using-firebase-32464580d8bb
            const storageService = firebase.storage();
            const storageRef = storageService.ref();

            //Login (on page)
            $(document).on("click", "#logIn", function() {
                event.preventDefault();
                var email = $("#emailInput").val();
                var pass = $("#passInput").val();
                var auth = firebase.auth();
                var promise = auth.signInWithEmailAndPassword(email, pass);
                promise.catch(e => console.log(e.message));
            });

            //Signup (on page)
            $(document).on("click", "#signUp", function() {
                event.preventDefault();
                var email = $("#emailInput").val();
                var pass = $("#passInput").val();
                var auth = firebase.auth();
                var promise = auth.createUserWithEmailAndPassword(email, pass);
                promise.catch(e => console.log(e.message));
            });

            //Logout(on page)
            $(document).on("click", "#logOut", function(event) {
                event.preventDefault();
                firebase.auth().signOut();
            });

            //Detects whether or not user has logged in
            auth.onAuthStateChanged(firebaseUser => {
              if (firebaseUser) {
                userID = firebaseUser.uid

                    // database.ref().child("user/" + userID + "/Font").set({
                    //     font: fontPref,
                    // });
              };
            });
                    
            // The handleFileUploadChange function gets triggered any time someone selects a new file via the upload via the Choose File upload button.
            $('.file-select').on('change', handleFileUploadChange);
            let selectedFile;
            function handleFileUploadChange(e) {
                    selectedFile = e.target.files[0];
                };
            
            // submit handling
            $(".entry-area").submit(function(event) {
                // prevent refresh
                event.preventDefault();
                
                // =============== IMAGE Handling =============
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
                                var queryURL = "https://api-us.faceplusplus.com/facepp/v3/detect?api_key=PYtXrUAv_8smka-0NHt41JdBmZ1jdL01&api_secret=OBmaSYKR7URc3NiFQgkjWNpIYafOU_35&return_attributes=emotion&image_url=" + imgurImageLink;

                                // AJAX call to Face++ (image)
                                $.ajax({
                                    url: queryURL,
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
                                    // Update DOM
                                    $("#image-anger").text(imageAnger + "%");
                                    $("#image-fear").text(imageFear + "%");
                                    $("#image-joy").text(imageJoy + "%");
                                    $("#image-sadness").text(imageSadness + "%");
                                    $("#image-surprise").text(imageSurprise + "%");
                                    $("#image-disgust").text(imageDisgust + "%");
                                    $("#image-neutral").text(imageNeutral + "%");
                                    
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
                            });
                        });
                    });
                };
                // Handling both link submission & local image select (link submission takes precedence)
                if ($("#image-submit").val()) {
                    var submittedLink = $("#image-submit").val();
                    console.log(submittedLink);
                    var queryURL = "https://api-us.faceplusplus.com/facepp/v3/detect?api_key=PYtXrUAv_8smka-0NHt41JdBmZ1jdL01&api_secret=OBmaSYKR7URc3NiFQgkjWNpIYafOU_35&return_attributes=emotion&image_url=" + submittedLink;

                    // AJAX call to Face++ (image)
                    $.ajax({
                        url: queryURL,
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
                        // Update DOM
                        $("#image-anger").text(imageAnger + "%");
                        $("#image-fear").text(imageFear + "%");
                        $("#image-joy").text(imageJoy + "%");
                        $("#image-sadness").text(imageSadness + "%");
                        $("#image-surprise").text(imageSurprise + "%");
                        $("#image-disgust").text(imageDisgust + "%");
                        $("#image-neutral").text(imageNeutral + "%");

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
                } else {
                    handleFileUploadSubmit(event);
                }
                
                // ================ TEXT HANDLING ==========================

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
                    var textFear = Number((response.results.fear * 100).toFixed(2))
                    var textJoy = Number((response.results.joy * 100).toFixed(2))
                    var textSadness = Number((response.results.sadness * 100).toFixed(2))
                    var textSurprise = Number((response.results.surprise * 100).toFixed(2))
                    // Update DOM
                    $("#text-anger").text(textAnger + "%");
                    $("#text-fear").text(textFear + "%");
                    $("#text-joy").text(textJoy + "%");
                    $("#text-sadness").text(textSadness + "%");
                    $("#text-surprise").text(textSurprise + "%");
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
            });
            
        });