//test function
function recordVid()
{
	if (mediaRecorder.state == 'inactive')
	{
		mediaRecorder.start();
		startVid.disabled = true;
		stopVid.disabled = false;

    	mediaRecorder.onstop = (ev)=>
    	{
            let blob = new Blob(chunks,
            	{
            		'mimeType':'video/mp4',
            		'codecs':'codecs=vp8'
            	});
            chunks = [];
            var temp = inc;
            //Create New Video Element
            const lName = "video " + (temp);
            var newLabel = document.createElement('label');
			newLabel.setAttribute("class", lName);
			newLabel.setAttribute("id", lName);
			const labelName = document.createTextNode(lName);
			newLabel.appendChild(labelName);
			var pos = document.getElementById('end');
			document.body.insertBefore(newLabel, pos);

			//breakline
			
			//Create an video element
			
			const vName = "video" + (temp);
			var newVideo = document.createElement('video');
			newVideo.setAttribute("class", vName);
			newVideo.setAttribute("id", vName);
			newVideo.setAttribute("width", "25%");
			newVideo.setAttribute("background-color","#666");
			newVideo.setAttribute("autoplay","true");
			newVideo.setAttribute("controls", "controls");
			document.body.appendChild(newVideo);
			pos = document.getElementById('testLab');
			document.body.insertBefore(newVideo, pos);
	        //Closed
            videoURL = window.URL.createObjectURL(blob);
            newVideo.src = videoURL;

            //script to send video to remote location

            const a = document.createElement('a');
            a.display = "none";
            a.href = videoURL;
            a.download = vName+".mp4";
            a.click();
            vidSave.src = videoURL;
            sendData(blob);
            /*
            const downloadLink = document.getElementById('lName');
            downloadLink.href = URL.createObjectURL(new Blob(chunks));
      		downloadLink.download = 'acetest.mp4';*/
		}

        mediaRecorder.ondataavailable = function(ev)
        {
            chunks.push(ev.data);
            console.log(chunks);
        }
	}
	else
	{
		startVid.disabled = false;
		stopVid.disabled = true;
	}
    console.log(mediaRecorder.state);
    inc++;
}

function stopRecord()
{
   if (mediaRecorder.state != 'inactive') {
		mediaRecorder.stop();
		stopVid.disabled = true;
		startVid.disabled = false;
	}
	else{
		stopVid.disabled = false;
		startVid.disabled = true;
	}
    console.log(mediaRecorder.state);
}
//window.onload = setTimeout(recordVid, 3000);
window.onload = function ()
{
		//setInterval(recordVid, 10000);
		//setInterval(stopRecord, 20000);
}

/*
	Function to create a sticky Navigation Bar
*/
window.onscroll = function() {myFunction()};

// Get the navbar
var navbar = document.getElementById("navbar");

// Get the offset position of the navbar
var sticky = navbar.offsetTop;

// Add the sticky class to the navbar when you reach its scroll position. Remove "sticky" when you leave the scroll position
function myFunction() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("stickyNav")
  } else {
    navbar.classList.remove("stickyNav");
  }
}