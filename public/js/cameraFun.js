/*This is a click event listener for the button with id startVid
		  Here media recorder will start recording the stream coming from
		  the webcam and will store it as a blob
*/
		var inc = 0;
		var startVid = document.querySelector("#startVid");
        startVid.addEventListener('click', (ev)=>
        {
        	navigator.mediaDevices.getUserMedia({
			}).then (function(mediaStreamObj)
			{
	            mediaRecorder= new MediaRecorder(mediaStreamObj);
	        });
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
		            		'codecs':'h.264'
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
					var parent = document.getElementById('displayVideo');
					var child = document.getElementById('end');
					parent.insertBefore(newLabel, child);

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
					parent.insertBefore(newVideo, end);
			        //Closed
		            videoURL = window.URL.createObjectURL(blob);
		            newVideo.src = videoURL;

		            const a = document.createElement('a');
		            a.display = "none";
		            a.href = videoURL;
		            a.download = vName+".mp4";
		            a.click();
		            //vidSave.src = videoURL;
		            //sendData(blob);
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
    	});